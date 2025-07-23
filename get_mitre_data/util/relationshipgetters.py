from . import relationshiphelpers as rsh
from . import stixhelpers

malware_used_by_groups = {}
tools_used_by_groups = {}
malware_used_by_campaigns = {}
tools_used_by_campaigns = {}
techniques_used_by_malware = {}
techniques_used_by_tools = {}
techniques_used_by_groups = {}
techniques_used_by_campaigns = {}
techniques_targeting_assets = {}
techniques_detected_by_datacomponent = {}
groups_using_tool = {}
groups_using_malware = {}
mitigation_mitigates_techniques = {}
technique_mitigated_by_mitigation = {}
datacomponents_detecting_technique = {}
tools_using_technique = {}
malware_using_technique = {}
groups_using_technique = {}
assets_targeted_by_techniques = {}
campaigns_using_technique = {}
campaigns_using_tool = {}
campaigns_using_malware = {}
groups_attributed_to_campaign = {}
campaigns_attributed_to_group = {}
subtechniques_of = {}
datacomponent_of = {}
datasource_of = {}
parent_technique_of = {}
objects_using_notes = {}

ms = {}
srcs = []

resources = {}
relationships = []

group_list = []
software_list = []
technique_list = []
datasource_list = []
datacomponent_list = []
mitigation_list = []
campaign_list = []
asset_list = []

technique_to_domain = {}

# Relationship getters


def get_malware_used_by_groups(srcs):
    """malware used by groups getter"""
    return rsh.malware_used_by_groups(srcs)


def get_tools_used_by_groups(srcs):
    """tools used by groups getter"""
    return rsh.tools_used_by_groups(srcs)


def get_malware_used_by_campaigns(srcs):
    """malware used by campaigns getter"""
    return rsh.malware_used_by_campaigns(srcs)


def get_tools_used_by_campaigns(srcs):
    """tools used by campaigns getter"""
    return rsh.tools_used_by_campaigns(srcs)


def get_techniques_used_by_malware(srcs):
    """techniques used by malware getter"""
    return rsh.techniques_used_by_malware(srcs)


def get_techniques_used_by_tools(srcs):
    """techniques used by tools getter"""
    return rsh.techniques_used_by_tools(srcs)


def get_techniques_used_by_groups(srcs):
    """techniques used by groups getter"""
    return rsh.techniques_used_by_groups(srcs)


def get_techniques_used_by_campaigns(srcs):
    """techniques used by campaigns getter"""
    return rsh.techniques_used_by_campaigns(srcs)


def get_techniques_targeting_assets(srcs):
    """techniques targeting assets getter"""
    return rsh.techniques_targeting_assets(srcs)


def get_assets_targeted_by_techniques(srcs):
    """assets targeted by techniques getter"""
    return rsh.assets_targeted_by_techniques(srcs)


def get_techniques_detected_by_datacomponent(srcs):
    global techniques_detected_by_datacomponent

    if not techniques_detected_by_datacomponent:
        techniques_detected_by_datacomponent = rsh.techniques_detected_by_datacomponent(get_srcs())

    return techniques_detected_by_datacomponent


def get_datacomponents_detecting_technique(srcs):
    global datacomponents_detecting_technique

    if not datacomponents_detecting_technique:
        datacomponents_detecting_technique = rsh.datacomponents_detecting_technique(get_srcs())

    return datacomponents_detecting_technique


def get_groups_using_tool(srcs):
    """groups using tool getter"""
    return rsh.groups_using_tool(srcs)


def get_groups_using_malware(srcs):
    """groups using malware getter"""
    return rsh.groups_using_malware(srcs)


def get_mitigation_mitigates_techniques(srcs):
    """mitigation migates techniques getter"""
    return rsh.mitigation_mitigates_techniques(srcs)


def get_technique_mitigated_by_mitigation(srcs):
    """technique mitigated by mitigation getter"""
    return rsh.technique_mitigated_by_mitigation(srcs)


def get_tools_using_technique(srcs):
    """tools using technique getter"""
    return rsh.tools_using_technique(srcs)


def get_malware_using_technique(srcs):
    """malware using technique getter"""
    return rsh.malware_using_technique(srcs)


def get_groups_using_technique(srcs):
    """groups using technique getter"""
    return rsh.groups_using_technique(srcs)


def get_campaigns_using_technique(srcs):
    """campaigns using technique getter"""
    return rsh.campaigns_using_technique(srcs)


def get_campaigns_using_tool(srcs):
    """campaigns using tool getter"""
    return rsh.campaigns_using_tool(srcs)


def get_campaigns_using_malware(srcs):
    """campaigns using malware getter"""
    return rsh.campaigns_using_malware(srcs)


def get_groups_attributed_to_campaign(srcs):
    """groups attributed to campaign getter"""
    return rsh.groups_attributed_to_campaign(srcs)


def get_campaigns_attributed_to_group(srcs):
    """campaigns attributed to group getter"""
    return rsh.campaigns_attributed_to_group(srcs)


def get_subtechniques_of(srcs):
    """subtechniques of techniques getter"""
    return rsh.subtechniques_of(srcs)


def get_datacomponent_of():
    """data components of data sources getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("datacomponent_of is not implemented in stixhelpers.py")


def get_datasource_of():
    """data source of data component getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("datasource_of is not implemented in stixhelpers.py")


def get_ms():
    """memory shares getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("get_stix_memory_stores is not implemented in stixhelpers.py")


def get_srcs():
    """memory shares without domain getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("get_stix_memory_stores is not implemented in stixhelpers.py")


def get_resources():
    """resources getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("grab_resources is not implemented in stixhelpers.py")


def get_relationships():
    """relationship getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("grab_resources/relationships is not implemented in stixhelpers.py")


def get_group_list():
    """group list getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("grab_resources/groups is not implemented in stixhelpers.py")


def get_software_list():
    """software list getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("grab_resources/software is not implemented in stixhelpers.py")


# Technique list setter/getter for minimal pipeline

def set_technique_list(tlist):
    """Set the technique list for the minimal pipeline."""
    global technique_list
    technique_list = tlist


def get_technique_list():
    """Get the technique list for the minimal pipeline."""
    global technique_list
    if not technique_list:
        raise ValueError("Technique list not set. Use set_technique_list() to provide it.")
    return technique_list


def get_mitigation_list():
    """mitigation list getter (use stixhelpers.get_mitigation_list directly)"""
    raise NotImplementedError("grab_resources/mitigations is not implemented in stixhelpers.py")


def get_campaign_list():
    """campaign list getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("grab_resources/campaigns is not implemented in stixhelpers.py")


def get_asset_list():
    """asset list getter (not implemented in minimal pipeline)"""
    raise NotImplementedError("grab_resources/assets is not implemented in stixhelpers.py")


# Technique-to-domain map setter/getter for minimal pipeline

def set_technique_to_domain(t2d):
    """Set the technique-to-domain map for the minimal pipeline."""
    global technique_to_domain
    technique_to_domain = t2d


def get_technique_to_domain():
    """Get the technique-to-domain map for the minimal pipeline."""
    global technique_to_domain
    if not technique_to_domain:
        raise ValueError("Technique-to-domain map not set. Use set_technique_to_domain() to provide it.")
    return technique_to_domain
