import matplotlib.pyplot as plt
import plotly.graph_objects as go
import numpy as np
from names import *
from util import *
from dataloader import quality_mapping

# Maps edit id to hex color
color_mapping = {
    'deletion': '#ee2a2a',
    'substitution': '#2186eb',
    'insertion': '#64C466',
    'split': '#F7CE46',
    'reorder': '#3ca3a7',
    'structure': '#FF9F15',

    Information.MORE: '#64C466',
    Information.SAME: '#2186eb',
    Information.LESS: '#ee2a2a',
    Information.DIFFERENT: '#b103fc'
}

# Maps system codes to names
system_name_mapping = {
    'new_systems/asset.test.simp.second': 'ASSET 2',
    'systems/asset.test.simp': 'ASSET 1',
    'new_systems/simple_wiki.txt': 'Simp Wiki',
    'new_systems/turk_corpus_random.txt': 'Turk Corpus',
    'systems/Dress-Ls.lower': 'DRESS',
    'systems/Hybrid.lower': 'Hybrid',
    'systems/T5.txt': 'T5',
    'systems/lstm_w_split.txt': 'LSTM Split',
    'systems/transformer_w_split.txt': 'BERT Split',
    'systems/con_simplification.txt': 'Controllable',
}

# Don't need this 
impact_mapping_for_visualization = {
    'error': Quality.ERROR,
    'trivial': Quality.TRIVIAL,
    'no error': Quality.QUALITY
}

# Maps error codes to names, don't need this
error_name_mapping = {
    Error.COREFERENCE: 'Coreference',
    Error.INFORMATION_REWRITE: 'Information Rewrite',
    Error.REPETITION: 'Repetition',
    Error.CONTRADICTION: 'Contradiction',
    Error.HALLUCINATION: 'Hallucination',
    Error.IRRELEVANT: 'Irrelevant',
    Error.UNNECESSARY_INSERTION: 'Unnecessary Insertion',
    Error.COMPLEX_WORDING: 'Complex Wording'
}

# When saving, use a high DPI
# plt.rcParams['figure.dpi'] = 300

# Ordering of labels in graphs
systems = system_name_mapping.keys()
edit_type_labels = ['insertion', 'deletion', 'substitution', 'split', 'reorder', 'structure']
all_system_labels = [x for x in [
    'systems/Hybrid.lower',
    'systems/Dress-Ls.lower',
    'systems/lstm_w_split.txt',
    'systems/transformer_w_split.txt',
    'systems/con_simplification.txt',
    'systems/T5.txt',
    'new_systems/turk_corpus_random.txt',
    'new_systems/simple_wiki.txt',
    'systems/asset.test.simp',
    'new_systems/asset.test.simp.second'
] if x in systems]
width = 0.5


def edit_type_by_system(data, flipped=True):
    # Create sums of different dimensions
    sum_edit_types = {system: sum_edits(data, system=system) for system in systems}
    system_labels = [x for x in all_system_labels if x in set([sent['system'] for sent in data])]
    
    if flipped:
        fig, ax = plt.subplots(figsize=(8, 4))
        bottom = [0 for x in range(len(system_labels))]
        for edit_type in edit_type_labels:
                val = [sum_edit_types[label][edit_type] for label in system_labels]
                displayed_x_labels = [system_name_mapping[label] for label in system_labels]
                ax.bar(displayed_x_labels, val, width, bottom=bottom, label=edit_type, color=color_mapping[edit_type])
                bottom = [bottom[i] + val[i] for i in range(len(val))]
        ax.set_xlabel('System')
        ax.set_title('Edit Types by System')
        ax.set_yticks([i*round(max(bottom)/5) for i in range(6)])
        ax.plot([1.5, 1.5], [0, ax.get_ylim()[-1]], ls='--', c='k')
    else:
        fig, ax = plt.subplots(figsize=(6, 4))
        bottom = [0 for x in range(len(edit_types))]

        for system in system_labels:
            val = [sum_edit_types[system][label] for label in edit_type_labels]
            ax.bar(edit_type_labels, val, width, bottom=bottom, label=system_name_mapping[system])
            bottom = [bottom[i] + val[i] for i in range(len(val))]
        ax.set_ylabel('Number of edits')
        ax.set_title('Edit Types by System')
    ax.legend()
    plt.show()

def system_by_information_change(data):
    # Same as the plot above but instead lexical, syntactic, and content simplification
    sum_info_change_types = {system: sum_info_change(data, system=system) for system in systems}

    fig, ax = plt.subplots(figsize=(8, 4))

    information_change_labels = [inn for inn in Information]

    system_labels = [x for x in all_system_labels if x in set([sent['system'] for sent in data])]

    bottom = [0 for x in range(len(system_labels))]
    for in_change in information_change_labels:
        val = [sum_info_change_types[label][in_change] for label in system_labels]
        displayed_x_labels = [system_name_mapping[label] for label in system_labels]
        ax.bar(displayed_x_labels, val, width, bottom=bottom, label=in_change.value, color=color_mapping[in_change])
        bottom = [bottom[i] + val[i] for i in range(len(val))]
    ax.set_xlabel('System')
    ax.set_title('Information Change by System')
    ax.set_yticks([i*round(max(bottom)/5) for i in range(6)])
    ax.plot([1.5, 1.5], [0, ax.get_ylim()[-1]], ls='--', c='k')
    ax.legend()
    plt.show()

def errors_by_system(data):
    sum_errors_types = {system: sum_errors(data, system=system) for system in systems}
    plotted_errors = [
        Error.COREFERENCE, 
        Error.REPETITION,  
        Error.CONTRADICTION,  
        Error.HALLUCINATION,  
        Error.IRRELEVANT, 
        Error.UNNECESSARY_INSERTION, 
        Error.INFORMATION_REWRITE,
        Error.COMPLEX_WORDING
    ]

    error_labels = [str(x).split('.')[1].lower().replace('_',' ') for x in plotted_errors]
    system_labels = [x for x in all_system_labels if x in set([sent['system'] for sent in data])]

    fig, ax = plt.subplots(figsize=(6, 4))
    bottom = [0 for x in range(len(error_labels))]

    width = 0.15

    count = 0 
    for system in system_labels:
        val = [sum_errors_types[system][label] for label in plotted_errors]
        x = np.arange(len(error_labels))
        ax.bar(x-(2*width)+count*width, val, width, label=system_name_mapping[system])
        bottom = [bottom[i] + val[i] for i in range(len(val))]
        count += 1
    ax.set_ylabel('Number of errors')
    ax.set_title('Errors by System')
    ax.legend()
    plt.xticks(x, error_labels, rotation=45, ha="right")
    plt.show()

def sankey_seperated(data):
    # Create a tree of edit types, following the decision tree
    root = Node(count_data(data), 'edits', -1)

    # Ideally shouldn't be doing this...
    edit_types = [val.value.lower() for val in Edit]
    information_mapping = {val.value.lower(): val for val in Information}

    counter = 0
    for edit_type in edit_types:
        root.add_child(Node(count_data(data, edit_type=edit_type), edit_type, counter))
        counter += 1

    for node in root.get_children():
        for info_change in information_mapping.values():
            node.add_child(Node(count_data(data, edit_type=node.label, information_impact=info_change), info_change, counter))
            counter += 1
        for child in node.get_children():
            for quality_type in Quality:
                child.add_child(Node(count_data(data, edit_type=node.label, information_impact=child.label, quality_type=quality_type), quality_type, counter))
                counter += 1

    # Convert the tree to a list of nodes & links
    stack = [child for child in root.get_children()]
    nodes, links = [], []
    while len(stack) > 0:
        node = stack.pop()

        # Map color if it has a mapping
        color = 'black'
        if node.label in color_mapping.keys():
            color = color_mapping[node.label]

        # Map label if it has a mapping
        in_mapping_back = {information_mapping[k]: k for k in information_mapping}
        if node.label in in_mapping_back.keys():
            node.label = in_mapping_back[node.label]
        impact_mapping_back = {impact_mapping_for_visualization[k]: k for k in impact_mapping_for_visualization}
        if node.label in impact_mapping_back.keys():
            node.label = impact_mapping_back[node.label]

        nodes.append({'id': node.id, 'label': node.label, 'color': color})

        # Get links to children
        for child in node.get_children():
            if child.amount > 0:
                links.append({'source': node.id, 'target': child.id, 'value': child.amount})
            stack.append(child)

    # Sort nodes by id
    nodes = sorted(nodes, key=lambda x: x['id'])

    # Convert dict tree values to lists
    labels, colors = [str(x['label']) for x in nodes], [x['color'] for x in nodes]
    sources, targets, values = [x['source'] for x in links], [x['target'] for x in links], [x['value'] for x in links]

    fig = go.Figure(data=[go.Sankey(
        node = dict(
        pad = 5,
        thickness = 10,
        line = dict(color = "black", width = 0.5),
        label = labels,
        color = colors
        ),
        link = dict(
        source = sources, # index of source node
        target = targets, # index of end node
        value = values,   # amount in link
        # label = data['link']['label'],   # label of link (not necessary)
        # color = data['link']['color']
        ),
        valueformat = "d",
        valuesuffix = " edits"
    )
    ])

    fig.update_layout(title_text="Edit Type Distribution", font_size=11, width=500, height=500)
    fig.show()

def sankey_combined(data):
    # Create nodes for each type
    nodes = {}
    links = []
    length_normalized = False
    counter = 0

    # Ideally shouldn't have to do this...
    edit_types = [val.value.lower() for val in Edit]
    information_mapping = {val.value.lower(): val for val in Information}

    for edit_type in edit_types:
        nodes[edit_type] = Node(count_data(data, edit_type=edit_type, length_normalized=length_normalized), edit_type, counter)
        counter += 1

    for info_change in Information:
        nodes[info_change] = Node(count_data(data, information_impact=info_change, length_normalized=length_normalized), info_change, counter)
        counter += 1

    for quality_type in Quality:
        nodes[quality_type] = Node(count_data(data, quality_type=quality_type, length_normalized=length_normalized), quality_type, counter)
        counter += 1

    for error_type in Error:
        nodes[error_type] = Node(count_data(data, error_type=error_type, length_normalized=length_normalized), error_type, counter)
        counter += 1

    for rating in range(4):
        nodes[rating] = Node(count_data(data, quality_type=Quality.QUALITY, rating=rating, length_normalized=length_normalized), rating, counter)
        counter += 1

    for rating in range(3):
        nodes["trivial_" + str(rating)] = Node(count_data(data, quality_type=Quality.TRIVIAL, rating=rating, length_normalized=length_normalized), "trivial_" + str(rating), counter)
        counter += 1

    # create edit_type -> info_change links
    for edit_type in edit_types:
        for info_change in Information:
            amt = count_data(data, edit_type=edit_type, information_impact=info_change, length_normalized=length_normalized)
            links.append({'source': nodes[edit_type].id, 'target': nodes[info_change].id, 'value': amt})

    # create info_change -> quality_type links
    for info_change in Information:
        for quality_type in Quality:
            amt = count_data(data, information_impact=info_change, quality_type=quality_type, length_normalized=length_normalized)
            links.append({'source': nodes[info_change].id, 'target': nodes[quality_type].id, 'value': amt})

    # create quality_type -> error_type links
    for quality_type in Quality:
        for error_type in Error:
            amt = count_data(data, quality_type=quality_type, error_type=error_type, length_normalized=length_normalized)
            links.append({'source': nodes[quality_type].id, 'target': nodes[error_type].id, 'value': amt})

    # create quality_type -> rating links
    for rating in range(4):
        amt = count_data(data, quality_type=Quality.QUALITY, rating=rating, length_normalized=length_normalized)
        links.append({'source': nodes[Quality.QUALITY].id, 'target': nodes[rating].id, 'value': amt})

    # create trivial -> rating links
    for rating in range(3):
        trivial_node_name = "trivial_" + str(rating)
        amt = count_data(data, quality_type=Quality.TRIVIAL, rating=rating, length_normalized=length_normalized)
        links.append({'source': nodes[Quality.TRIVIAL].id, 'target': nodes[trivial_node_name].id, 'value': amt})

    nodes = [{'id': x.id, 'label': x.label, 'color': 'black'} for x in nodes.values()]

    for node in nodes:
        # Map color if it has a mapping
        if node['label'] in color_mapping.keys():
            node['color'] = color_mapping[node['label']]

        # Map label if it has a mapping
        name_mapping = {}
        name_mapping.update({information_mapping[k]: k for k in information_mapping})
        name_mapping.update({impact_mapping_for_visualization[k]: k for k in impact_mapping_for_visualization})
        name_mapping.update(error_name_mapping)
        name_mapping.update({quality_mapping[k]: k for k in quality_mapping})

        if node['label'] in name_mapping.keys():
            node['label'] = name_mapping[node['label']]

    # Convert dict tree values to lists
    labels, colors = [str(x['label']) for x in nodes], [x['color'] for x in nodes]
    sources, targets, values = [x['source'] for x in links], [x['target'] for x in links], [x['value'] for x in links]

    fig = go.Figure(data=[go.Sankey(
        node = dict(
        pad = 15,
        thickness = 10,
        line = dict(color = "black", width = 0.5),
        label = labels,
        color = colors
        ),
        link = dict(
        source = sources, # index of source node
        target = targets, # index of end node
        value = values,   # amount in link
        # label = data['link']['label'],   # label of link (not necessary)
        # color = data['link']['color']
        ),
        valueformat = "d",
        valuesuffix = " edits"
    )
    ])

    fig.update_layout(title_text="Edit Type Distribution", font_size=11, width=700, height=500)
    fig.show()
    