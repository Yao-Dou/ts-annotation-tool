from names import *

# try not to use this
mapping = {
    'deletion': 0,
    'substitution': 1,
    'insertion': 3,
    'split': 2,
    'reorder': 4,
    'structure': 5
}

# Utility class for creating edit type trees
class Node:
    def __init__(self, amount, label, id):
        self.children = []
        self.amount = amount
        self.label = label
        self.id = id

    def add_child(self, child):
        self.children.append(child)

    def get_children(self):
        return self.children

    def __str__(self):
        return str([self.label, self.amount, [str(x) for x in self.children]])

# Counts some slice of annotations
def count_data(data, edit_type=None, information_impact=None, quality_type=None, error_type=None, rating=None, length_normalized=False):
    annotations = [i for j in [x['processed_annotations'] for x in data] for i in j]
    if edit_type != None:
        annotations = [x for x in annotations if x['edit_type'] == edit_type]
    if information_impact != None:
        annotations = [x for x in annotations if x['information_impact'] == information_impact]
    if quality_type != None:
        annotations = [x for x in annotations if x['type'] == quality_type]
    if error_type != None:
        annotations = [x for x in annotations if x['error_type'] == error_type]
    if rating != None:
        annotations = [x for x in annotations if x['rating'] == rating]

    if length_normalized:
        return sum([x['size'] for x in annotations])

    return len(annotations)

# Given a set of spans, returns all spans of a given type
def get_spans_by_type(spans, type_):
    return [x for x in spans if x[0] == mapping[type_]]

# Given a sentence, returns number of edits for each type
def count_edits(sent):
    out = {}
    for type_ in mapping.keys():
        count = max([x[3] for x in get_spans_by_type(sent['original_spans'], type_)] + [x[3] for x in get_spans_by_type(sent['simplified_spans'], type_)] + [0])
        out[type_] = count

    for count in out:
        if count == None:
            raise Exception(sent)
    
    return out

def count_info_change(sent):
    out = {}
    for type_ in Information:
        out[type_] = sum([1 for ann in sent['processed_annotations'] if ann['information_impact'] == type_])
    return out

# Gets sum of all edits, optionally filtered by system
def sum_edits(data, system=None):
    if system is not None:
        data = get_sentences_for_system(data, system)
    
    # Initialize mapping array
    out = {}
    for type_ in mapping.keys():
        out[type_] = 0

    for sent in data:
        num_edits = count_edits(sent)
        for type_ in num_edits.keys():
            out[type_] += num_edits[type_]
    return out

# Get sum of all information change types
def sum_info_change(data, system=None):
    if system is not None:
        data = get_sentences_for_system(data, system)

    out = {}
    for type_ in Information:
        out[type_] = 0
    for sent in data:
        num_edits = count_info_change(sent)
        for type_ in num_edits.keys():
            out[type_] += num_edits[type_]
    return out

# Gets sum of errors
def sum_errors(data, system=None):
    if system is not None:
        data = get_sentences_for_system(data, system)

    ann = [i for j in [sent['processed_annotations'] for sent in data] for i in j]
    errors = [a for a in ann if a['type'] == Quality.ERROR]
    
    # Initialize mapping array
    out = {}
    for type_ in Error:
        errors_by_type = [e for e in errors if e['error_type'] == type_]
        out[type_] = len(errors_by_type)
    return out

# Returns sentences for system
def get_sentences_for_system(data, system):
    return [x for x in data if x['system'] == system]

# Return the comments within the data
def get_comments(data):
    for entry in data:
        if 'comment' in entry.keys():
            print(f"{entry['user'].upper()} - HIT {str(entry['id']+1)}: {entry['comment']}")
