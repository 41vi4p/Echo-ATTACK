import datetime
import re

from . import relationshipgetters, util_config


def get_created_and_modified_dates(obj):
    """Given an object, return the modified and created dates."""
    dates = {}

    if obj.get("created"):
        dates["created"] = format_date(obj["created"])
    if obj.get("modified"):
        dates["modified"] = format_date(obj["modified"])

    return dates


def format_date(date):
    """Given a date string, format to %d %B %Y."""
    if isinstance(date, str):
        date = datetime.datetime.strptime(date, "%Y-%m-%dT%H:%M:%S.%fZ")

    return ("{} {} {}".format(date.strftime("%d"), date.strftime("%B"), date.strftime("%Y")))


def get_first_last_seen_dates(obj):
    """Given an object, return the first_seen and last_seen dates."""
    dates = {}

    if obj.get("first_seen"):
        dates["first_seen"] = format_date_as_month_year(obj["first_seen"])
    if obj.get("last_seen"):
        dates["last_seen"] = format_date_as_month_year(obj["last_seen"])

    return dates


def get_first_last_seen_citations(obj):
    """Given an object, return the first seen and last seen citations."""
    data = {}
    if obj.get("x_mitre_first_seen_citation"):
        data["first_seen_citation"] = obj.get("x_mitre_first_seen_citation")
    if obj.get("x_mitre_last_seen_citation"):
        data["last_seen_citation"] = obj.get("x_mitre_last_seen_citation")
    return data


def format_date_as_month_year(date):
    """Given a date string, format to %B %Y."""
    if isinstance(date, str):
        date = datetime.datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")

    return ("{} {}".format(date.strftime("%B"), date.strftime("%Y")))


def get_attack_id(obj):
    """Given an object, return attack_id."""
    external_references = obj.get("external_references")
    if external_references:
        index = find_index_id(external_references)

        if index != util_config.NOT_FOUND:
            return external_references[index]["external_id"]

    return None


def find_index_id(ext_ref):
    """Search for the index of the external_id in the external reference list."""
    for idx, ref in enumerate(ext_ref):
        if ref.get("external_id"):
            return idx
    return -1


def update_reference_list(reference_list, obj):
    """Update the reference list with the external references found in the object."""
    if obj.get("external_references"):
        for ext_ref in obj["external_references"]:
            if ext_ref.get("source_name") and ext_ref.get("description"):
                if "(Citation:" in ext_ref["description"]:
                    continue
                in_list = find_in_reference_list(reference_list, ext_ref["source_name"])
                if not in_list:
                    new_ref = {"description": ext_ref["description"], "number": None}
                    if ext_ref.get("url"):
                        new_ref["url"] = ext_ref["url"]
                    reference_list[ext_ref["source_name"]] = new_ref
    return reference_list


def get_alias_data(alias_list, ext_refs):
    """Generate the Alias Description section for the pages."""
    if not alias_list:
        return []
    alias_data = []
    for alias in alias_list:
        found_ext_refs = [x for x in ext_refs if x["source_name"] == alias]
        if found_ext_refs:
            ext = found_ext_refs[0]
            if ext.get("description"):
                row = {"name": alias, "descr": ext["description"]}
                alias_data.append(row)
    return alias_data


def is_deprecated(sdo):
    return sdo.get("x_mitre_deprecated")


def is_revoked(sdo):
    return sdo.get("revoked")


def filter_deprecated_revoked(sdos):
    filtered_sdos = []
    for sdo in sdos:
        deprecated = is_deprecated(sdo=sdo)
        revoked = is_revoked(sdo=sdo)
        if not deprecated and not revoked:
            filtered_sdos.append(sdo)
    return filtered_sdos


def is_tid(tid):
    pattern = re.compile("^T[0-9][0-9][0-9][0-9]$")
    return pattern.match(tid)


def is_sub_tid(sub_tid):
    pattern = re.compile("^T[0-9][0-9][0-9][0-9].[0-9][0-9][0-9]$")
    return pattern.match(sub_tid)


def get_parent_technique_id(sub_tid):
    return sub_tid.split(".")[0]


def get_sub_technique_id(sub_tid):
    return sub_tid.split(".")[1]


def get_technique_name(tid):
    """
    Given a technique ID, return the technique name.
    Requires that set_technique_list() has been called in relationshipgetters.
    """
    technique_list = relationshipgetters.get_technique_list()
    for technique in technique_list:
        attack_id = get_attack_id(technique)
        if attack_id == tid:
            return technique["name"]
    return util_config.NOT_FOUND


def technique_used_helper(technique_list, technique, reference_list, inherited=False):
    attack_id = get_attack_id(technique["object"])
    if attack_id:
        if attack_id not in technique_list or inherited:
            technique_data = get_technique_data_helper(attack_id, technique, reference_list)
            if not technique_data:
                return technique_list
            if is_sub_tid(attack_id):
                parent_id = get_parent_technique_id(attack_id)
                if parent_id not in technique_list:
                    technique_list[parent_id] = parent_technique_used_helper(parent_id)
                for subtechnique in technique_list[parent_id]["subtechniques"]:
                    if subtechnique["id"] == technique_data["id"] and inherited:
                        if "descr" in technique_data and "descr" in subtechnique:
                            subtechnique["descr"] += "\n" + technique_data["descr"]
                        elif "descr" in technique_data:
                            subtechnique["descr"] = technique_data["descr"]
                        break
                else:
                    technique_list[parent_id]["subtechniques"].append(technique_data)
                technique_list[parent_id]["subtechniques"] = sorted(
                    technique_list[parent_id]["subtechniques"], key=lambda k: k["id"]
                )
            else:
                if attack_id in technique_list:
                    if "descr" in technique_data and "descr" in technique_list[attack_id]:
                        technique_list[attack_id]["descr"] += "\n" + technique_data["descr"]
                    elif "descr" in technique_data:
                        technique_list[attack_id]["descr"] = technique_data["descr"]
                else:
                    technique_list[attack_id] = technique_data
        elif technique_list[attack_id]["technique_used"] == False:
            technique_list[attack_id]["technique_used"] = True
            if technique["relationship"].get("description"):
                technique_list[attack_id]["descr"] = technique["relationship"]["description"]
                reference_list = update_reference_list(reference_list, technique["relationship"])
    return technique_list


def get_technique_data_helper(attack_id, technique, reference_list):
    technique_data = {}
    technique_to_domain = relationshipgetters.get_technique_to_domain()
    if attack_id not in technique_to_domain:
        return {}
    technique_data["technique_used"] = True
    technique_data["domain"] = technique_to_domain[attack_id].split("-")[0]
    if is_sub_tid(attack_id):
        technique_data["id"] = get_sub_technique_id(attack_id)
    else:
        technique_data["id"] = attack_id
    technique_data["name"] = technique["object"]["name"]
    if technique["relationship"].get("description"):
        technique_data["descr"] = technique["relationship"]["description"]
        reference_list = update_reference_list(reference_list, technique["relationship"])
    technique_data["subtechniques"] = []
    return technique_data


def parent_technique_used_helper(parent_id):
    parent_data = {}
    technique_to_domain = relationshipgetters.get_technique_to_domain()
    parent_data["domain"] = technique_to_domain[parent_id].split("-")[0]
    parent_data["id"] = parent_id
    parent_data["name"] = get_technique_name(parent_id)
    parent_data["technique_used"] = False
    parent_data["subtechniques"] = []
    return parent_data


def find_in_reference_list(reference_list, source_name):
    return source_name in reference_list
