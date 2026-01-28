#algorithm 
#description This script retrieves MITRE ATT&CK data and formats it for a CTI system.
#load the mitre data from the following sources:
# - https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json
# - https://raw.githubusercontent.com/mitre/cti/master/mobile-attack/mobile-attack.json
# - https://raw.githubusercontent.com/mitre/cti/master/ics-attack/ics-attack.json
#use helper functions to properly format and compile the data from these sources into the CTI system format
#the actual formating code is in the groups.py file
# pull the data from the sources in this main file and store them in data and start the process function which is in the groups.py 
# store the final data in a folder called output
# in the output folder there should 1 json file per APT group which has the all the data related to that APT group.

import os
import json
import requests
from stix2 import MemoryStore
from util import relationshipgetters
import groups
import glob

# URLs for MITRE ATT&CK data
SOURCES = [
    "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json",
    "https://raw.githubusercontent.com/mitre/cti/master/mobile-attack/mobile-attack.json",
    "https://raw.githubusercontent.com/mitre/cti/master/ics-attack/ics-attack.json",
]

OUTPUT_DIR = "../data"

def clean_output_dir():
    files = glob.glob(os.path.join(OUTPUT_DIR, "*.json"))
    for f in files:
        try:
            os.remove(f)
        except Exception as e:
            print(f"[WARN] Could not delete {f}: {e}")

def download_stix(url):
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()["objects"]


def main():
    # Clean output directory before writing new files
    clean_output_dir()
    # Download and combine all STIX objects
    all_objects = []
    for url in SOURCES:
        print(f"[INFO] Downloading: {url}")
        all_objects.extend(download_stix(url))
    print(f"[INFO] Downloaded {len(all_objects)} total STIX objects.")

    # Create a MemoryStore for all objects
    ms = MemoryStore(stix_data=all_objects)
    srcs = [ms]
    print("[INFO] Created in-memory STIX store.")

    # Extract group objects (intrusion sets)
    group_list = [obj for obj in all_objects if obj.get("type") == "intrusion-set"]
    print(f"[INFO] Found {len(group_list)} intrusion-set (group) objects.")

    # Optionally, set technique list and technique-to-domain map for helpers
    technique_list = [obj for obj in all_objects if obj.get("type") == "attack-pattern"]
    relationshipgetters.set_technique_list(technique_list)
    print(f"[INFO] Set technique list with {len(technique_list)} attack-pattern objects.")
    # Build technique-to-domain map
    technique_to_domain = {obj["external_references"][0]["external_id"]: obj["x_mitre_domains"][0] for obj in technique_list if obj.get("external_references") and obj.get("x_mitre_domains")}
    relationshipgetters.set_technique_to_domain(technique_to_domain)
    print(f"[INFO] Set technique-to-domain map.")

    # Write output: one JSON file per group, batch-wise
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    batch_size = 10  # You can adjust this for your memory constraints
    total_groups = len(group_list)
    print(f"[INFO] Processing and writing groups in batches of {batch_size}...")
    for i in range(0, total_groups, batch_size):
        batch = group_list[i:i+batch_size]
        print(f"[INFO] Processing batch {i//batch_size+1} ({i+1}-{min(i+batch_size, total_groups)})...")
        processed_groups = []
        for idx, group in enumerate(batch, start=i+1):
            print(f"[INFO] Formatting group {idx}/{total_groups} (id={group.get('id')}, name={group.get('name')})...")
            try:
                processed = groups.process_single_group(group, notes={}, srcs=srcs)
                if processed and processed.get("attack_id"):
                    out_path = os.path.join(OUTPUT_DIR, f"{processed['attack_id']}.json")
                    with open(out_path, "w", encoding="utf-8") as f:
                        json.dump(processed, f, indent=2, ensure_ascii=False)
                    print(f"[INFO] Wrote {out_path}")
                else:
                    print(f"[WARN] Skipped group {idx} (missing attack_id or processing failed)")
            except Exception as e:
                print(f"[ERROR] Failed to process group {idx} (id={group.get('id')}): {e}")
        print(f"[INFO] Finished batch {i//batch_size+1}.")
    print(f"[INFO] All batches complete. Wrote group files to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
