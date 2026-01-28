import json
from collections.abc import Iterable
import util


def process_groups_data(group_list=None, srcs=None):
    """
    Extracts, processes, and compiles MITRE group data using helper functions.
    Returns a list of processed group dictionaries, one per group.
    group_list: Optional. If not provided, raises NotImplementedError.
    srcs: List of STIX memory stores (required for relationship getters).
    """
    if group_list is None or srcs is None:
        raise NotImplementedError(
            "Group list and srcs must be provided to process_groups_data(group_list=..., srcs=...) in the minimal pipeline."
        )
    group_list_clean = util.buildhelpers.filter_deprecated_revoked(group_list)
    notes = {}  # Notes loading is not implemented in minimal pipeline
    processed_groups = []
    for group in group_list_clean:
        processed = process_single_group(group, notes, srcs)
        if processed:
            processed_groups.append(processed)
    return processed_groups


def process_single_group(group, notes, srcs):
    """
    Processes a single group and returns a dictionary with all compiled data.
    """
    attack_id = util.buildhelpers.get_attack_id(group)
    if not attack_id:
        return None
    data = {
        "attack_id": attack_id,
        "notes": notes.get(group["id"]),
    }
    ext_ref = group.get("external_references", [])

    dates = util.buildhelpers.get_created_and_modified_dates(group)

    if dates.get("created"):
        data["created"] = dates["created"]

    if dates.get("modified"):
        data["modified"] = dates["modified"]

    if group.get("name"):
        data["name"] = group["name"]

    if group.get("x_mitre_version"):
        data["version"] = group["x_mitre_version"]

    if isinstance(group.get("x_mitre_contributors"), Iterable):
        data["contributors_list"] = group["x_mitre_contributors"]

    reference_list = util.buildhelpers.update_reference_list({"current_number": 0}, group)

    if group.get("description"):
        data["descr"] = group["description"]

    if group.get("x_mitre_deprecated"):
        data["deprecated"] = True

    data["technique_table_data"], _ = get_techniques_used_by_group_data(group, reference_list, srcs)

    data["campaign_data"], data["add_campaign_ref"] = get_campaign_table_data(group, reference_list, srcs)
    data["software_data"], data["add_software_ref"] = get_software_table_data(group, reference_list, srcs)

    if group.get("aliases"):
        # Only add alias_descriptions if there are more than one alias
        if len(group["aliases"]) > 1:
            data["alias_descriptions"] = util.buildhelpers.get_alias_data(
                alias_list=group["aliases"][1:], ext_refs=ext_ref
            )

    data["citations"] = reference_list

    if isinstance(group.get("aliases"), Iterable):
        data["aliases_list"] = group["aliases"][1:]

    return data


def get_techniques_used_by_group_data(group, reference_list, srcs):
    """Given a group and its reference list, get the techniques used by the group.

    Check the reference list for citations, if not found in list, add it.
    """
    technique_list = {}

    techniques_used_by_groups = util.relationshipgetters.get_techniques_used_by_groups(srcs)

    if techniques_used_by_groups.get(group.get("id")):
        for technique in techniques_used_by_groups[group["id"]]:
            # Do not add if technique is deprecated
            if not technique["object"].get("x_mitre_deprecated"):
                technique_list = util.buildhelpers.technique_used_helper(technique_list, technique, reference_list)

    # add campaign-related techniques to list
    campaigns_attributed_to_group = {
        "campaigns": util.relationshipgetters.get_campaigns_attributed_to_group(srcs),
        "techniques": util.relationshipgetters.get_techniques_used_by_campaigns(srcs),
    }
    hasInheritedTechniques = False
    if campaigns_attributed_to_group["campaigns"].get(group.get("id")):
        for campaign in campaigns_attributed_to_group["campaigns"][group["id"]]:
            campaign_id = campaign["object"]["id"]
            if campaigns_attributed_to_group["techniques"].get(campaign_id):  # campaign has techniques
                for technique in campaigns_attributed_to_group["techniques"][campaign_id]:
                    # Do not add if technique is deprecated
                    if not technique["object"].get("x_mitre_deprecated"):
                        hasInheritedTechniques = True
                        technique_list = util.buildhelpers.technique_used_helper(
                            technique_list, technique, reference_list, True
                        )

    technique_data = list(technique_list.values())
    # Sort by technique name only (removed domain sort)
    technique_data = sorted(technique_data, key=lambda k: k["name"].lower())
    return technique_data, hasInheritedTechniques


def get_campaign_table_data(group, reference_list, srcs):
    """Given a group, get the campaign table data."""
    campaign_list = {}  # campaign stix id => {attack id, name, description}
    reference = False
    campaigns_attributed_to_group = {
        "campaigns": util.relationshipgetters.get_campaigns_attributed_to_group(srcs),
        "techniques": util.relationshipgetters.get_techniques_used_by_campaigns(srcs),
    }

    if campaigns_attributed_to_group["campaigns"].get(group.get("id")):
        for campaign in campaigns_attributed_to_group["campaigns"][group["id"]]:
            campaign_id = campaign["object"]["id"]
            if campaign_id not in campaign_list:
                attack_id = util.buildhelpers.get_attack_id(campaign["object"])
                campaign_dates = util.buildhelpers.get_first_last_seen_dates(campaign["object"])
                date_citations = util.buildhelpers.get_first_last_seen_citations(campaign["object"])
                campaign_list[campaign_id] = {
                    "id": attack_id,
                    "name": campaign["object"]["name"],
                    "first_seen": campaign_dates["first_seen"] if campaign_dates.get("first_seen") else "",
                    "last_seen": campaign_dates["last_seen"] if campaign_dates.get("last_seen") else "",
                    "first_seen_citation": date_citations["first_seen_citation"]
                    if date_citations.get("first_seen_citation")
                    else "",
                    "last_seen_citation": date_citations["last_seen_citation"]
                    if date_citations.get("last_seen_citation")
                    else "",
                }
                if date_citations.get("first_seen_citation") or date_citations.get("last_seen_citation"):
                    reference = True
                    reference_list = util.buildhelpers.update_reference_list(reference_list, campaign["object"])

                if campaign["relationship"].get("description"):
                    if reference is False:
                        reference = True
                    campaign_list[campaign_id]["desc"] = campaign["relationship"]["description"]
                    reference_list = util.buildhelpers.update_reference_list(reference_list, campaign["relationship"])

                if campaigns_attributed_to_group["techniques"].get(campaign_id):
                    if "techniques" not in campaign_list[campaign_id]:
                        campaign_list[campaign_id]["techniques"] = []
                    for technique in campaigns_attributed_to_group["techniques"][campaign_id]:
                        t_id = util.buildhelpers.get_attack_id(technique["object"])
                        tech_data = {}
                        if t_id:
                            if util.buildhelpers.is_sub_tid(t_id):
                                tech_data["parent_id"] = util.buildhelpers.get_parent_technique_id(t_id)
                                tech_data["id"] = util.buildhelpers.get_sub_technique_id(t_id)
                                tech_data["name"] = util.buildhelpers.get_technique_name(tech_data["parent_id"])
                                tech_data["sub_name"] = technique["object"]["name"]
                            else:
                                tech_data["id"] = t_id
                                tech_data["name"] = technique["object"]["name"]
                            campaign_list[campaign_id]["techniques"].append(tech_data)

    campaign_data = []
    for item in campaign_list:
        if "techniques" in campaign_list[item]:
            campaign_list[item]["techniques"] = sorted(
                campaign_list[item]["techniques"], key=lambda k: k["name"].lower()
            )
        campaign_data.append(campaign_list[item])
    campaign_data = sorted(campaign_data, key=lambda k: k["name"].lower())
    return campaign_data, reference


def get_software_table_data(group, reference_list, srcs):
    """Given a group, get software table data."""
    software_list = {}
    reference = False
    tools_and_malware = [
        {
            "software": util.relationshipgetters.get_tools_used_by_groups(srcs),
            "techniques": util.relationshipgetters.get_techniques_used_by_tools(srcs),
        },
        {
            "software": util.relationshipgetters.get_malware_used_by_groups(srcs),
            "techniques": util.relationshipgetters.get_techniques_used_by_malware(srcs),
        },
    ]
    software_list, reference = update_software_list(
        pairings=tools_and_malware,
        software_list=software_list,
        reference_list=reference_list,
        reference=reference,
        id=group.get("id"),
    )
    campaigns_attributed_to_group = util.relationshipgetters.get_campaigns_attributed_to_group(srcs)
    software_used_by_campaigns = [
        {
            "software": util.relationshipgetters.get_malware_used_by_campaigns(srcs),
            "techniques": util.relationshipgetters.get_techniques_used_by_malware(srcs),
        },
        {
            "software": util.relationshipgetters.get_tools_used_by_campaigns(srcs),
            "techniques": util.relationshipgetters.get_techniques_used_by_tools(srcs),
        },
    ]
    if campaigns_attributed_to_group.get(group.get("id")):
        for campaign in campaigns_attributed_to_group[group["id"]]:
            campaign_id = campaign["object"]["id"]
            software_list, reference = update_software_list(
                pairings=software_used_by_campaigns,
                software_list=software_list,
                reference_list=reference_list,
                reference=reference,
                id=campaign_id,
            )
    data = []
    for item in software_list:
        if "techniques" in software_list[item]:
            software_list[item]["techniques"] = sorted(
                software_list[item]["techniques"], key=lambda k: k["name"].lower()
            )
        data.append(software_list[item])
    data = sorted(data, key=lambda k: k["name"].lower())
    return data, reference


def update_software_list(pairings: list, software_list: dict, reference_list: dict, reference: bool, id: str):
    """Update the software list with the given pairings.

    This function iterates through the given pairings and updates the software list with
    the software that matches the given ID. It also updates the reference list with the
    corresponding reference.
    """
    for pairing in pairings:
        if pairing["software"].get(id):
            for software in pairing["software"][id]:
                software_stix_id = software["object"]["id"]
                software_attack_id = util.buildhelpers.get_attack_id(software["object"])
                if software_stix_id not in software_list and software_attack_id:
                    software_list[software_stix_id] = {"id": software_attack_id, "name": software["object"]["name"]}
                    if software["relationship"].get("description"):
                        reference = True
                        software_list[software_stix_id]["descr"] = software["relationship"]["description"]
                        reference_list = util.buildhelpers.update_reference_list(
                            reference_list, software["relationship"]
                        )
                    if pairing["techniques"].get(software_stix_id):
                        if "techniques" not in software_list[software_stix_id]:
                            software_list[software_stix_id]["techniques"] = []
                        for technique in pairing["techniques"][software_stix_id]:
                            tech_data = {}
                            t_id = util.buildhelpers.get_attack_id(technique["object"])
                            if t_id:
                                if util.buildhelpers.is_sub_tid(t_id):
                                    tech_data["parent_id"] = util.buildhelpers.get_parent_technique_id(t_id)
                                    tech_data["id"] = util.buildhelpers.get_sub_technique_id(t_id)
                                    tech_data["name"] = util.buildhelpers.get_technique_name(tech_data["parent_id"])
                                    tech_data["sub_name"] = technique["object"]["name"]
                                else:
                                    tech_data["id"] = t_id
                                    tech_data["name"] = technique["object"]["name"]
                                software_list[software_stix_id]["techniques"].append(tech_data)
    return software_list, reference