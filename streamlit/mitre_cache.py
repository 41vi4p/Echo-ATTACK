"""
MITRE Data Cache Service
Handles caching, loading, and querying of MITRE APT group data from the get_mitre_data/output folder.
"""

import asyncio
import json
import os
import sqlite3
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import structlog
from pathlib import Path
import hashlib

logger = structlog.get_logger()


@dataclass
class APTGroup:
    """Structured representation of an APT group."""
    attack_id: str
    name: str
    description: str
    created: str
    modified: str
    version: str
    technique_table_data: List[Dict[str, Any]]
    software_data: List[Dict[str, Any]]
    campaign_data: List[Dict[str, Any]]
    alias_descriptions: List[Dict[str, Any]]
    citations: Dict[str, Any]
    aliases_list: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class MITRECache:
    """Cache service for MITRE APT group data."""
    
    def __init__(self, cache_dir: str = "data/mitre_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Cache database
        self.db_path = self.cache_dir / "mitre_cache.db"
        self.cache_duration = timedelta(hours=24)  # Cache for 24 hours
        
        # In-memory cache
        self._memory_cache: Dict[str, APTGroup] = {}
        self._cache_loaded = False
        
        # MITRE data source directory
        self.mitre_data_dir = Path("get_mitre_data/output")
        
        # Initialize database
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database for caching."""
        with sqlite3.connect(str(self.db_path)) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS apt_groups (
                    attack_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    data_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    modified_at TEXT NOT NULL,
                    cache_timestamp TEXT NOT NULL,
                    content_hash TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS search_index (
                    term TEXT NOT NULL,
                    attack_id TEXT NOT NULL,
                    relevance_score REAL NOT NULL,
                    context TEXT,
                    PRIMARY KEY (term, attack_id)
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_search_term ON search_index(term);
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_attack_id ON search_index(attack_id);
            """)
            
            conn.commit()
    
    def _generate_content_hash(self, content: str) -> str:
        """Generate hash for content to detect changes."""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _filter_used_techniques(self, technique_data: List[Dict[str, Any]], apt_name: str = "") -> List[Dict[str, Any]]:
        """Filter techniques to only include those actually used by the APT group.
        
        Args:
            technique_data: Raw technique data from JSON file
            apt_name: Name of APT group for logging purposes
            
        Returns:
            Filtered list containing only techniques where technique_used is True
        """
        filtered_techniques = []
        original_count = len(technique_data)
        used_main_techniques = 0
        used_subtechniques = 0
        
        for technique in technique_data:
            # Check if main technique is used
            if technique.get('technique_used', False):
                # If main technique is used, include it with all its subtechniques
                filtered_techniques.append(technique)
                used_main_techniques += 1
                # Count used subtechniques
                for subtechnique in technique.get('subtechniques', []):
                    if subtechnique.get('technique_used', False):
                        used_subtechniques += 1
            else:
                # If main technique is not used, check subtechniques
                used_subtechniques_for_this_technique = []
                for subtechnique in technique.get('subtechniques', []):
                    if subtechnique.get('technique_used', False):
                        used_subtechniques_for_this_technique.append(subtechnique)
                        used_subtechniques += 1
                
                # If any subtechniques are used, include the main technique with only used subtechniques
                if used_subtechniques_for_this_technique:
                    filtered_technique = technique.copy()
                    filtered_technique['subtechniques'] = used_subtechniques_for_this_technique
                    filtered_technique['technique_used'] = False  # Keep original state for clarity
                    filtered_techniques.append(filtered_technique)
        
        filtered_count = len(filtered_techniques)
        if apt_name:
            logger.debug(f"Filtered techniques for {apt_name}: {original_count} -> {filtered_count} "
                        f"({used_main_techniques} main techniques, {used_subtechniques} subtechniques used)")
        
        return filtered_techniques

    def _load_apt_group_from_file(self, file_path: Path) -> Optional[APTGroup]:
        """Load APT group data from JSON file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Filter technique data to only include used techniques
            raw_technique_data = data.get('technique_table_data', [])
            apt_name = data.get('name', '')
            filtered_technique_data = self._filter_used_techniques(raw_technique_data, apt_name)
            
            # Convert to APTGroup object
            apt_group = APTGroup(
                attack_id=data.get('attack_id', ''),
                name=data.get('name', ''),
                description=data.get('descr', ''),
                created=data.get('created', ''),
                modified=data.get('modified', ''),
                version=data.get('version', ''),
                technique_table_data=filtered_technique_data,
                software_data=data.get('software_data', []),
                campaign_data=data.get('campaign_data', []),
                alias_descriptions=data.get('alias_descriptions', []),
                citations=data.get('citations', {}),
                aliases_list=data.get('aliases_list', [])
            )
            
            return apt_group
            
        except Exception as e:
            logger.error(f"Failed to load APT group from {file_path}: {e}")
            return None
    
    def _is_cache_valid(self, cache_timestamp: str) -> bool:
        """Check if cache entry is still valid."""
        try:
            cached_time = datetime.fromisoformat(cache_timestamp.replace('Z', '+00:00'))
            return datetime.now() - cached_time < self.cache_duration
        except:
            return False
    
    async def load_mitre_data(self) -> Dict[str, APTGroup]:
        """Load MITRE APT data from files or cache."""
        if self._cache_loaded and self._memory_cache:
            return self._memory_cache
        
        logger.info("Loading MITRE APT data...")
        
        # First try to load from database cache
        cached_data = self._load_from_database()
        
        # Check if we need to update from files
        if not cached_data or self._should_update_from_files():
            logger.info("Updating MITRE data from source files...")
            file_data = await self._load_from_files()
            
            if file_data:
                # Update database cache
                self._save_to_database(file_data)
                self._memory_cache = file_data
            else:
                # Fall back to cached data if file loading fails
                self._memory_cache = cached_data or {}
        else:
            self._memory_cache = cached_data
        
        self._cache_loaded = True
        logger.info(f"Loaded {len(self._memory_cache)} APT groups")
        
        # Build search index
        await self._build_search_index()
        
        return self._memory_cache
    
    def _load_from_database(self) -> Dict[str, APTGroup]:
        """Load APT data from database cache."""
        try:
            with sqlite3.connect(str(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT attack_id, data_json, cache_timestamp
                    FROM apt_groups
                """)
                
                cached_groups = {}
                for row in cursor.fetchall():
                    attack_id, data_json, cache_timestamp = row
                    
                    # Check if cache is still valid
                    if self._is_cache_valid(cache_timestamp):
                        try:
                            data = json.loads(data_json)
                            apt_group = APTGroup(**data)
                            cached_groups[attack_id] = apt_group
                        except Exception as e:
                            logger.warning(f"Failed to deserialize cached APT group {attack_id}: {e}")
                
                logger.info(f"Loaded {len(cached_groups)} APT groups from cache")
                return cached_groups
                
        except Exception as e:
            logger.error(f"Failed to load from database cache: {e}")
            return {}
    
    def _should_update_from_files(self) -> bool:
        """Check if we should update from files based on file modification times."""
        try:
            if not self.mitre_data_dir.exists():
                return False
            
            # Get the most recent modification time of any JSON file
            latest_file_time = datetime.min
            for json_file in self.mitre_data_dir.glob("*.json"):
                file_time = datetime.fromtimestamp(json_file.stat().st_mtime)
                if file_time > latest_file_time:
                    latest_file_time = file_time
            
            # Check database for latest cache timestamp
            with sqlite3.connect(str(self.db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT MAX(cache_timestamp) FROM apt_groups
                """)
                result = cursor.fetchone()
                
                if result[0]:
                    latest_cache_time = datetime.fromisoformat(result[0])
                    return latest_file_time > latest_cache_time
                else:
                    return True  # No cache exists
                    
        except Exception as e:
            logger.warning(f"Failed to check file modification times: {e}")
            return True  # Default to updating
    
    async def _load_from_files(self) -> Dict[str, APTGroup]:
        """Load APT data from JSON files."""
        try:
            if not self.mitre_data_dir.exists():
                logger.error(f"MITRE data directory not found: {self.mitre_data_dir}")
                return {}
            
            apt_groups = {}
            json_files = list(self.mitre_data_dir.glob("*.json"))
            
            logger.info(f"Loading {len(json_files)} APT group files...")
            
            for json_file in json_files:
                apt_group = self._load_apt_group_from_file(json_file)
                if apt_group:
                    apt_groups[apt_group.attack_id] = apt_group
            
            logger.info(f"Successfully loaded {len(apt_groups)} APT groups from files")
            return apt_groups
            
        except Exception as e:
            logger.error(f"Failed to load APT data from files: {e}")
            return {}
    
    def _save_to_database(self, apt_groups: Dict[str, APTGroup]):
        """Save APT data to database cache."""
        try:
            current_time = datetime.now().isoformat()
            
            with sqlite3.connect(str(self.db_path)) as conn:
                # Clear existing data
                conn.execute("DELETE FROM apt_groups")
                
                # Insert new data
                for attack_id, apt_group in apt_groups.items():
                    data_json = json.dumps(apt_group.to_dict())
                    content_hash = self._generate_content_hash(data_json)
                    
                    conn.execute("""
                        INSERT INTO apt_groups 
                        (attack_id, name, description, data_json, created_at, modified_at, cache_timestamp, content_hash)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        attack_id,
                        apt_group.name,
                        apt_group.description,
                        data_json,
                        apt_group.created,
                        apt_group.modified,
                        current_time,
                        content_hash
                    ))
                
                conn.commit()
                logger.info(f"Saved {len(apt_groups)} APT groups to database cache")
                
        except Exception as e:
            logger.error(f"Failed to save to database cache: {e}")
    
    async def _build_search_index(self):
        """Build search index for efficient querying."""
        try:
            with sqlite3.connect(str(self.db_path)) as conn:
                # Clear existing index
                conn.execute("DELETE FROM search_index")
                
                # Build new index
                for attack_id, apt_group in self._memory_cache.items():
                    # Index name and aliases
                    terms = [apt_group.name.lower()]
                    terms.extend([alias.lower() for alias in apt_group.aliases_list])
                    
                    # Index technique names (only for used techniques)
                    for technique in apt_group.technique_table_data:
                        if technique.get('name'):
                            # Only index if the technique is actually used
                            if technique.get('technique_used', False):
                                terms.append(technique['name'].lower())
                            # Also index used subtechniques
                            for subtechnique in technique.get('subtechniques', []):
                                if subtechnique.get('technique_used', False) and subtechnique.get('name'):
                                    terms.append(subtechnique['name'].lower())
                    
                    # Index software names
                    for software in apt_group.software_data:
                        if software.get('name'):
                            terms.append(software['name'].lower())
                    
                    # Index description keywords
                    desc_words = apt_group.description.lower().split()
                    # Add significant words (longer than 3 characters)
                    terms.extend([word for word in desc_words if len(word) > 3])
                    
                    # Insert terms into search index
                    for term in set(terms):  # Remove duplicates
                        if term.strip():
                            relevance_score = self._calculate_relevance(term, apt_group)
                            conn.execute("""
                                INSERT OR IGNORE INTO search_index 
                                (term, attack_id, relevance_score, context)
                                VALUES (?, ?, ?, ?)
                            """, (term.strip(), attack_id, relevance_score, apt_group.name))
                
                conn.commit()
                logger.info("Built search index for APT groups")
                
        except Exception as e:
            logger.error(f"Failed to build search index: {e}")
    
    def _calculate_relevance(self, term: str, apt_group: APTGroup) -> float:
        """Calculate relevance score for a search term."""
        score = 0.0
        
        # Exact name match gets highest score
        if term == apt_group.name.lower():
            score += 10.0
        
        # Alias match
        if term in [alias.lower() for alias in apt_group.aliases_list]:
            score += 8.0
        
        # Technique name match (only for used techniques)
        for technique in apt_group.technique_table_data:
            if technique.get('name') and term in technique['name'].lower():
                # Only score if the technique is actually used
                if technique.get('technique_used', False):
                    score += 5.0
            # Also check subtechniques
            for subtechnique in technique.get('subtechniques', []):
                if (subtechnique.get('name') and term in subtechnique['name'].lower() 
                    and subtechnique.get('technique_used', False)):
                    score += 5.0
        
        # Software name match
        for software in apt_group.software_data:
            if software.get('name') and term in software['name'].lower():
                score += 4.0
        
        # Description keyword match
        if term in apt_group.description.lower():
            score += 2.0
        
        return score
    
    async def search_apt_groups(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Search APT groups based on query."""
        if not self._cache_loaded:
            await self.load_mitre_data()
        
        query_terms = query.lower().split()
        results = []
        
        try:
            with sqlite3.connect(str(self.db_path)) as conn:
                cursor = conn.cursor()
                
                # Search for each term
                for term in query_terms:
                    cursor.execute("""
                        SELECT attack_id, relevance_score, context
                        FROM search_index
                        WHERE term LIKE ?
                        ORDER BY relevance_score DESC
                        LIMIT ?
                    """, (f"%{term}%", max_results))
                    
                    for row in cursor.fetchall():
                        attack_id, relevance_score, context = row
                        
                        if attack_id in self._memory_cache:
                            apt_group = self._memory_cache[attack_id]
                            results.append({
                                "attack_id": attack_id,
                                "name": apt_group.name,
                                "description": apt_group.description[:200] + "..." if len(apt_group.description) > 200 else apt_group.description,
                                "aliases": apt_group.aliases_list,
                                "relevance_score": relevance_score,
                                "context": context,
                                "techniques_count": len(apt_group.technique_table_data),
                                "software_count": len(apt_group.software_data)
                            })
            
            # Sort by relevance and remove duplicates
            seen = set()
            unique_results = []
            for result in sorted(results, key=lambda x: x['relevance_score'], reverse=True):
                if result['attack_id'] not in seen:
                    seen.add(result['attack_id'])
                    unique_results.append(result)
            
            return unique_results[:max_results]
            
        except Exception as e:
            logger.error(f"Failed to search APT groups: {e}")
            return []
    
    async def get_apt_group(self, attack_id: str) -> Optional[APTGroup]:
        """Get specific APT group by attack ID."""
        if not self._cache_loaded:
            await self.load_mitre_data()
        
        return self._memory_cache.get(attack_id)
    
    async def get_apt_groups_by_technique(self, technique_id: str) -> List[APTGroup]:
        """Get APT groups that use a specific technique (only considers actually used techniques)."""
        if not self._cache_loaded:
            await self.load_mitre_data()
        
        matching_groups = []
        
        for apt_group in self._memory_cache.values():
            for technique in apt_group.technique_table_data:
                # Check main technique
                if ((technique.get('id') == technique_id or technique_id in technique.get('name', '')) 
                    and technique.get('technique_used', False)):
                    matching_groups.append(apt_group)
                    break
                
                # Check subtechniques
                for subtechnique in technique.get('subtechniques', []):
                    if ((subtechnique.get('id') == technique_id or technique_id in subtechnique.get('name', ''))
                        and subtechnique.get('technique_used', False)):
                        matching_groups.append(apt_group)
                        break
                else:
                    continue
                break
        
        return matching_groups
    
    async def get_apt_groups_by_software(self, software_name: str) -> List[APTGroup]:
        """Get APT groups that use specific software."""
        if not self._cache_loaded:
            await self.load_mitre_data()
        
        matching_groups = []
        software_name_lower = software_name.lower()
        
        for apt_group in self._memory_cache.values():
            for software in apt_group.software_data:
                if software_name_lower in software.get('name', '').lower():
                    matching_groups.append(apt_group)
                    break
        
        return matching_groups
    
    async def get_all_techniques(self) -> Dict[str, Set[str]]:
        """Get all techniques actually used by APT groups (only includes techniques with technique_used=True)."""
        if not self._cache_loaded:
            await self.load_mitre_data()
        
        techniques = {}
        
        for apt_group in self._memory_cache.values():
            for technique in apt_group.technique_table_data:
                technique_id = technique.get('id')
                
                # Only include if main technique is used
                if technique_id and technique.get('technique_used', False):
                    if technique_id not in techniques:
                        techniques[technique_id] = set()
                    techniques[technique_id].add(apt_group.attack_id)
                
                # Also include used subtechniques
                for subtechnique in technique.get('subtechniques', []):
                    subtechnique_id = subtechnique.get('id')
                    if subtechnique_id and subtechnique.get('technique_used', False):
                        # Format subtechnique ID as parent.subtechnique (e.g., T1583.002)
                        full_id = f"{technique_id}.{subtechnique_id}"
                        if full_id not in techniques:
                            techniques[full_id] = set()
                        techniques[full_id].add(apt_group.attack_id)
        
        return techniques
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        if not self._cache_loaded:
            await self.load_mitre_data()
        
        return {
            "total_apt_groups": len(self._memory_cache),
            "cache_loaded": self._cache_loaded,
            "cache_dir": str(self.cache_dir),
            "db_path": str(self.db_path),
            "mitre_data_dir": str(self.mitre_data_dir),
            "last_updated": datetime.now().isoformat()
        }
    
    async def refresh_cache(self):
        """Force refresh of cache from source files."""
        logger.info("Forcing cache refresh...")
        self._cache_loaded = False
        self._memory_cache = {}
        
        # Clear database cache
        with sqlite3.connect(str(self.db_path)) as conn:
            conn.execute("DELETE FROM apt_groups")
            conn.execute("DELETE FROM search_index")
            conn.commit()
        
        # Reload from files
        await self.load_mitre_data()


# Global cache instance
mitre_cache = MITRECache()


async def main():
    """Test the MITRE cache service."""
    cache = MITRECache()
    
    # Load data
    apt_groups = await cache.load_mitre_data()
    print(f"Loaded {len(apt_groups)} APT groups")
    
    # Test search
    results = await cache.search_apt_groups("APT28")
    print(f"Search results for 'APT28': {len(results)}")
    for result in results:
        print(f"  - {result['name']} ({result['attack_id']})")
    
    # Test specific group retrieval
    apt_group = await cache.get_apt_group("G0007")
    if apt_group:
        print(f"Retrieved APT group: {apt_group.name}")
    
    # Get stats
    stats = await cache.get_cache_stats()
    print(f"Cache stats: {stats}")


if __name__ == "__main__":
    asyncio.run(main())