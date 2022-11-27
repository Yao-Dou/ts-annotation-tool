import matplotlib.pyplot as plt
import plotly.graph_objects as go
import numpy as np
from names import *
from util import *
from dataloader import quality_mapping
from scipy.stats import kendalltau

# Temporary for getting rid of errors
import warnings
warnings.filterwarnings("ignore")

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
    Information.DIFFERENT: '#b103fc',

    'new_systems/asset.test.simp.second': 'orange',
    'new_systems/turk_corpus_random.txt': 'blue',
    'systems/T5.txt': 'red',
    'systems/asset.test.simp': 'green',
    'systems/con_simplification.txt': 'purple',

    'new-wiki-1/Muss': '#FFB145',
    'new-wiki-1/GPT-3-zero-shot': '#FF4545',
    'new-wiki-1/GPT-3-few-shot': '#FF45D7',
    'new-wiki-1/Human 1 Writing': '#45FFDA',
    'new-wiki-1/Human 2 Writing': '#45FF7A'
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
    'new-wiki-1/Muss': 'MUSS',
    'new-wiki-1/GPT-3-zero-shot': 'GPT-3 Zero',
    'new-wiki-1/GPT-3-few-shot': 'GPT-3 Few',
    'new-wiki-1/Human 1 Writing': 'Human 1',
    'new-wiki-1/Human 2 Writing': 'Human 2'
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
    'new-wiki-1/Muss',
    'new-wiki-1/GPT-3-zero-shot',
    'new-wiki-1/GPT-3-few-shot',
    'new_systems/turk_corpus_random.txt',
    'new_systems/simple_wiki.txt',
    'systems/asset.test.simp',
    'new_systems/asset.test.simp.second',
    'new-wiki-1/Human 1 Writing',
    'new-wiki-1/Human 2 Writing'
] if x in systems]

# MatPlotLib parameters
width = 0.5
plt.rcParams["figure.figsize"] = [7.5, 4]
plt.rcParams["figure.autolayout"] = True
plt.rcParams["figure.max_open_warning"] = False

def edit_type_by_system(data, flipped=True, normalized=False, all_datasets=False):
    # Normalized will divide the number of edits by the total number of sentences

    # Create sums of different dimensions
    sum_edit_types = {system: sum_edits(data, system=system, normalized=normalized) for system in systems}
    system_labels = [x for x in all_system_labels if x in set([sent['system'] for sent in data])]

    if flipped:
        size = (8, 4)
        if all_datasets:
            size = (10, 4)
        fig, ax = plt.subplots(figsize=size)
        bottom = [0 for x in range(len(system_labels))]
        for edit_type in edit_type_labels:
            val = [sum_edit_types[label][edit_type] for label in system_labels]
            displayed_x_labels = [system_name_mapping[label] for label in system_labels]
            ax.bar(displayed_x_labels, val, width, bottom=bottom, label=edit_type, color=color_mapping[edit_type])
            bottom = [bottom[i] + val[i] for i in range(len(val))]
        ax.set_xlabel('System')
        ax.set_title('Edit Types by System')
        ax.set_yticks([i*round(max(bottom)/5) for i in range(6)])
        line_location = [2.5, 2.5]
        if all_datasets:
            line_location = [4.5, 4.5]
        ax.plot(line_location, [0, ax.get_ylim()[-1]], ls='--', c='k')
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
    ax.plot([2.5, 2.5], [0, ax.get_ylim()[-1]], ls='--', c='k')
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
    ax.plot([4.5, 4.5], [0, ax.get_ylim()[-1]], ls='--', c='k')
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

    # Substitution trivial insertions have no efficacy, include this
    nodes["trivial_4"] = Node(count_data(data, quality_type=Quality.TRIVIAL, rating=None, length_normalized=length_normalized), "trivial_4", counter)
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

    # create trivial -> trivial paraphrase links
    trivial_node_name = "trivial_4"
    amt = count_data(data, quality_type=Quality.TRIVIAL, rating=None, length_normalized=length_normalized)
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

        # Teporary trivial name mapping
        name_mapping.update({
            "trivial_0": "0 Rating",
            "trivial_1": "1 Rating",
            "trivial_2": "2 Rating",
            "trivial_4": "Trivial Paraphrase",
        })

        if node['label'] in name_mapping.keys():
            node['label'] = name_mapping[node['label']]

    # Convert dict tree values to lists
    labels, colors = [str(x['label']).capitalize() for x in nodes], [x['color'] for x in nodes]
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
        ),]   
    )
    fig.update_layout(
        title_text="", 
        # font_family="Times New Roman",
        font_color="black",
        font_size=11, 
        width=700,
        height=500
    )
    fig.show()
    
def draw_agreement(sents):
    sents = sorted(sents, key=lambda x: x['user'], reverse=True)
    annotator = sorted(list(set([f"{x['user']}\nBatch {x['batch']}\nHIT {x['hit_id']+1}" for x in sents])), reverse=True)

    fig, ax = plt.subplots(2)
    for axis_num, sent_type in enumerate(['original_span', 'simplified_span']):
        if sent_type == 'original_span':
            b1 = ax[axis_num].barh(annotator, [len(sents[0]['original']) for i in sents], color="blue", alpha=0.2)
        elif sent_type == 'simplified_span':
            b1 = ax[axis_num].barh(annotator, [len(sents[0]['simplified']) for i in sents], color="blue", alpha=0.2)

        for edit_type in edit_type_labels:
            entry = []
            for edit_number in range(max([len([x for x in sent['edits'] if x['type'] == edit_type]) for sent in sents])):
                e = []
                for i in range(len(sents)):
                    edits = [x for x in sents[i]['edits'] if x['type'] == edit_type]
                    if edit_number < len(edits) and edits[edit_number][sent_type] is not None:
                        e.append(edits[edit_number][sent_type])
                    else:
                        e.append([(0, 0)])
                entry.append(e)
            
            for edit in entry:
                for i in range(max([len(x) for x in edit])):
                    spans = []
                    for ann in edit:
                        if i < len(ann):
                            spans.append(ann[i])
                        else:
                            spans.append((0, 0))
                    e = spans
                    b2 = ax[axis_num].barh(annotator, [x[1]-x[0] for x in e], left=[x[0] for x in e], color=color_mapping[edit_type], alpha=0.5)

        ax[axis_num].set_xticks([])

        ax[axis_num].spines['bottom'].set_visible(False)
        ax[axis_num].spines['top'].set_visible(False)
        ax[axis_num].spines['left'].set_visible(False)
        ax[axis_num].spines['right'].set_visible(False)
    
    # plt.legend([b1, b2], ["None", "Deletion", "Substitution"], title="Edit Type", loc="upper right")
    # fig.suptitle(f'Batch {sents[0]["batch"]} | HIT {sents[0]["hit_id"]+1}')
    fig.suptitle(f"{sents[0]['original'][:30]}...")

    fig.show()

def avg_span_size(annotations):
    span_size = [avg([x['size'] for x in annotations if x['edit_type'] == edit_type]) for edit_type in edit_type_labels]
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.bar(edit_type_labels, span_size, width, color=[color_mapping[label] for label in edit_type_labels])
    ax.set_xlabel('System')
    ax.set_title('Average Edit Span Size')
    plt.show()

def score_distribution(data, include_simpeval=False):
    annotations = sorted([x for y in [sent['processed_annotations'] for sent in data] for x in y], key=lambda x: x['score'])

    # Print distribution of edit scores
    n_bins = 100

    if include_simpeval:
        fig, axs = plt.subplots(2, 2, tight_layout=True)
        axs[0, 0].hist([x['score'] for x in annotations], bins=n_bins)
        axs[0, 0].set_title("Distribution of Edit Scores")

        # Print distribution of sentence scores
        axs[0, 1].hist([x['score'] for x in data], bins=n_bins)
        axs[0, 1].set_title("Distribution of Sentence Scores")

        # Print distribution of simp eval scores
        axs[1, 0].hist([i for j in [x['simpeval_scores'] for x in data] for i in j], bins=n_bins)
        axs[1, 0].set_title("Distribution of SimpEval Scores")

        # Print distribution of simp eval scores
        axs[1, 1].hist([avg(x['simpeval_scores']) for x in data], bins=n_bins)
        axs[1, 1].set_title("Distribution of Avg. SimpEval Scores")
        fig.show()
    else:
        fig, axs = plt.subplots(1, 2, tight_layout=True)
        axs[0].hist([x['score'] for x in annotations], bins=n_bins)
        axs[0].set_title("Distribution of Edit Scores")

        # Print distribution of sentence scores
        axs[1].hist([x['score'] for x in data], bins=n_bins)
        axs[1].set_title("Distribution of Sentence Scores")
    fig.show()

def simpeval_agreement(data, average=True):
    if (average):
        scores = [(avg(sent['simpeval_scores'], prec=5), sent['score']) for sent in data]
    else:
        # Simply takes the first annotator
        scores = []
        for sent in data:
            if len(sent['simpeval_scores']) != 0:
                scores.append((int(sent['simpeval_scores'][0]), sent['score']))
            else:
                scores.append((0, sent['score']))
    pts = [p for p in scores if p[0] != 0]
    kt = kendalltau([p[0] for p in pts], [p[1] for p in pts])
    plt.scatter([p[0] for p in pts], [p[1] for p in pts], c ="red", alpha=0.2)
    plt.xlabel('Average SimpEval score')
    plt.ylabel('Our score')
    plt.figtext(.1, .8, f"corr = {kt.correlation:.2f} | p = {kt.pvalue:.2f}")
    plt.title(f'SimpEval Correlation ({len(pts)} sentences)')
    plt.show()

def edit_length(data, systems, type_='edit_dist', simpeval=False):
    total_sent = 0
    for system in systems:
        if type_ == 'edit_dist':
            plt.ylabel('Edit Distance')
            if simpeval:
                scores = [(avg(sent['simpeval_scores'], prec=10), edit_dist(sent['original'], sent['simplified'])) for sent in data if sent['system'] == system]
            else:
                scores = [(sent['score'], edit_dist(sent['original'], sent['simplified'])) for sent in data if sent['system'] == system]
        elif type_ == 'char_diff':
            plt.ylabel('% of sentence modified')
            if simpeval:
                scores = [(avg(sent['simpeval_scores'], prec=10), sum([x['size'] for x in sent['processed_annotations']])) for sent in data if sent['system'] == system]
            else:
                scores = [(sent['score'], sum([x['size'] for x in sent['processed_annotations']])) for sent in data if sent['system'] == system]
        plt.scatter([p[0] for p in scores], [p[1] for p in scores], c=color_mapping[system], alpha=0.5, label=system_name_mapping[system])
        total_sent += len(scores)
    if simpeval:
        plt.xlabel('SimpEval score')
    else:
        plt.xlabel('Our score')
    plt.title(f'Scoring vs. Edits ({total_sent} sentences)')
    plt.legend()
    plt.show()
