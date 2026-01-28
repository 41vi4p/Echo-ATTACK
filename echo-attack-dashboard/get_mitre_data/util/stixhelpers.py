import stix2
from . import buildhelpers, relationshipgetters
from . import relationshiphelpers as rsh


def get_mitigation_list(src, get_deprecated=False):
    """Read the STIX and return a list of all mitigations in the STIX."""
    mitigations = src.query([stix2.Filter("type", "=", "course-of-action"), stix2.Filter("revoked", "=", False)])

    if not get_deprecated:
        # Filter out deprecated objects for mitigation pages
        mitigations = [x for x in mitigations if not hasattr(x, "x_mitre_deprecated") or x.x_mitre_deprecated is False]

    return sorted(mitigations, key=lambda k: k["name"].lower())


def get_datasources(srcs):
    """Read the STIX and return a list of data sources in the STIX."""
    datasources = rsh.query_all(srcs, [stix2.Filter("type", "=", "x-mitre-data-source")])

    resultUsedIds = set()
    results = []
    # Filter out duplicates
    for datasource in datasources:
        if datasource["id"] not in resultUsedIds:
            results.append(datasource)
            resultUsedIds.add(datasource["id"])

    return results


def get_datacomponents(srcs):
    """Read the STIX and return a list of data components in the STIX."""
    datacomponents = rsh.query_all(srcs, [stix2.Filter("type", "=", "x-mitre-data-component")])

    resultUsedIds = set()
    results = []
    # Filter out duplicates
    for datacomponent in datacomponents:
        if datacomponent["id"] not in resultUsedIds:
            results.append(datacomponent)
            resultUsedIds.add(datacomponent["id"])

    return results


def get_all_of_type(src, types):
    """Read the STIX and return a list of all of a particular type of object in the STIX.

    Removes duplicate STIX and ATT&CK IDs.
    """
    stix_objs = {}
    attack_id_objs = {}

    for stix_type in types:
        result = src.query([stix2.Filter("type", "=", stix_type)])
        for obj in result:
            add_replace_or_ignore(stix_objs=stix_objs, attack_id_objs=attack_id_objs, obj_in_question=obj)

    return [attack_id_objs[key] for key in attack_id_objs]


def get_techniques(src, domain):
    """Read the STIX and return a list of all techniques in the STIX by given domain."""
    tech_list = src.query([stix2.Filter("type", "=", "attack-pattern"), stix2.Filter("revoked", "=", False)])
    # Filter out by domain
    tech_list = [x for x in tech_list if not hasattr(x, "x_mitre_domains") or domain in x.get("x_mitre_domains")]

    tech_list = sorted(tech_list, key=lambda k: k["name"].lower())
    return tech_list


def add_replace_or_ignore(stix_objs, attack_id_objs, obj_in_question):
    """Add if object does not already exist.

    Replace object if exist depending on deprecation status or modified date
    Ignore if object already exists but object in question is outdated

    Deconflicts objects by ATT&CK and STIX IDs
    """

    def has_STIX_ATTACK_ID_conflict(attack_id):
        """Check if STIX ID has been seen before.

        If it has, return ATT&CK ID of conflict ATT&CK if ATT&CK IDs are different.
        """
        conflict = stix_objs.get(obj_in_question.get("id"))
        if conflict:
            conflict_attack_id = buildhelpers.get_attack_id(conflict)
            if conflict_attack_id != attack_id and attack_id_objs.get(conflict_attack_id):
                return conflict_attack_id

        return None

    def replace_object(attack_id, conflict_attack_id):
        # Replaces object on ATT&CK and STIX maps
        # Verify for STIX to ATT&CK conflict
        if conflict_attack_id:
            attack_id_objs[attack_id] = obj_in_question
            # Remove outdated ATT&CK ID from map
            attack_id_objs.pop(conflict_attack_id)
        else:
            attack_id_objs[attack_id] = obj_in_question

        stix_objs[obj_in_question.get("id")] = obj_in_question

    # Get ATT&CK ID
    attack_id = buildhelpers.get_attack_id(obj_in_question)

    if not attack_id:
        # Ignore if ATT&CK ID does not exist
        return

    # Get ATT&CK ID if there is possible conflict with STIX ID and ATT&CK ID
    conflict_attack_id = has_STIX_ATTACK_ID_conflict(attack_id)

    # Check if object in question exists by STIX ID
    stix_id_obj_in_question = stix_objs.get(obj_in_question.get("id"))
    if not stix_id_obj_in_question:
        # Add if object does not exist in STIX ID map
        stix_objs[obj_in_question.get("id")] = obj_in_question

    # Get ATT&CK ID conflicts
    if conflict_attack_id:
        attack_id_obj_in_conflict = attack_id_objs.get(conflict_attack_id)
    else:
        attack_id_obj_in_conflict = attack_id_objs.get(attack_id)

    # Add: Object does not exist
    if not attack_id_obj_in_conflict:
        # Add if object does not exist in ATT&CK ID map
        attack_id_objs[attack_id] = obj_in_question

    # Replace: Object already exists
    # Ignore if object in question is deprecated and object in conflict is not
    elif not attack_id_obj_in_conflict.get("x_mitre_deprecated") and obj_in_question.get("x_mitre_deprecated"):
        return

    # If object in conflict is deprecated and recent object is not, select recent
    elif attack_id_obj_in_conflict.get("x_mitre_deprecated") and not obj_in_question.get("x_mitre_deprecated"):
        # Replace object in conflict with object in question
        replace_object(attack_id, conflict_attack_id)

    # Replace if modified date is more recent
    else:
        conflict_modified = attack_id_obj_in_conflict.get("modified")
        in_question_modified = obj_in_question.get("modified")

        if in_question_modified > conflict_modified:
            # Replace object in conflict with object in question
            replace_object(attack_id, conflict_attack_id)
