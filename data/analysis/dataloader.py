import copy
from enum import Enum

# Maps the edit id to the edit
mapping = {
    'deletion': 0,
    'substitution': 1,
    'insertion': 3,
    'split': 2,
    'reorder': 4,
    'structure': 5
}

# Maps edit id to hex color
color_mapping = {
    'deletion': '#ee2a2a',
    'substitution': '#2186eb',
    'insertion': '#64C466',
    'split': '#F7CE46',
    'reorder': '#3ca3a7',
    'structure': '#FF9F15'
}

# Specify metadata for an empty span
empty_span = {
    'span': None,
    'span_length': None
}

# Enums declaring annotation types
class Information(Enum):
    LESS = 1
    SAME = 2
    MORE = 3
    DIFFERENT = 4

class Error(Enum):
    COREFERENCE = 1
    INFORMATION_REWRITE = 2
    REPETITION = 3
    CONTRADICTION = 4
    HALLUCINATION = 5
    IRRELEVANT = 6
    UNNECESSARY_INSERTION = 7
    COMPLEX_WORDING = 8

class Quality(Enum):
    QUALITY = 1
    TRIVIAL = 2
    ERROR = 3

class ReorderLevel(Enum):
    WORD = 1
    COMPONENT = 2
    
# Maps raw annotation outputs to enums or numbers
quality_mapping = {
    'very bad': 0,
    'bad': 1,
    'good': 2,
    'perfect': 3,
}

simplification_quality_mapping = {
    'minor': 0,
    'somewhat': 1,
    'a lot': 2
}

severity_mapping = {
    'not at all': 0,
    'minor': 1,
    'somewhat': 2,
    'a lot': 3,
}

different_meaning_severity_mapping = {
    'minor': 0,
    'somewhat': 1,
    'very': 2,
}

impact_mapping = {
    'negative': Quality.ERROR,
    'no': Quality.TRIVIAL,
    'positive': Quality.QUALITY
}

error_mapping = {
    'yes': True,
    'no': False
}

information_mapping = {
    'less': Information.LESS,
    'same': Information.SAME,
    'more': Information.MORE,
    'different': Information.DIFFERENT
}

error_type_mapping = {
    'repetition': Error.REPETITION,
    'contradiction': Error.CONTRADICTION,
    'hallucination': Error.HALLUCINATION,
}

reorder_mapping = {
    'word': ReorderLevel.WORD,
    'component': ReorderLevel.COMPONENT
}

# Maps system codes to names
system_name_mapping = {
    'new_systems/asset.test.simp.second': 'ASSET',
    'new_systems/simple_wiki.txt': 'Simp Wiki',
    'new_systems/turk_corpus_random.txt': 'Turk Corpus',
    'systems/Dress-Ls.lower': 'DRESS',
    'systems/Hybrid.lower': 'Hybrid',
    'systems/T5.txt': 'T5',
    'systems/lstm_w_split.txt': 'LSTM Split',
    'systems/transformer_w_split.txt': 'BERT Split'
}

 # Maps error codes to names
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

# Given a set of spans, returns all spans of a given type
def get_spans_by_type(spans, type_):
    return [x for x in spans if x[0] == mapping[type_]]

# Given a sentence, returns number of edits for each type
def count_edits(sent):
    out = {}
    for type_ in mapping.keys():
        count = max([x[3] for x in get_spans_by_type(sent['original_spans'], type_)] + [x[3] for x in get_spans_by_type(sent['simplified_spans'], type_)] + [0])
        out[type_] = count
    return out

# Gets sum of all edits
def sum_edits(data):
    out = {}
    for type_ in mapping.keys():
        out[type_] = 0
    for sent in data:
        num_edits = count_edits(sent)
        for type_ in num_edits.keys():
            out[type_] += num_edits[type_]
    return out

# Returns sentences for system
def get_sentences_for_system(data, system):
    return [x for x in data if x['system'] == system]

# Returns total number of edits for a given system
def sum_edits_for_system(data, system):
    return sum_edits(get_sentences_for_system(data, system))

# Creates basic metadata about each span
def get_span_metadata(spans):
    out = []
    for type_ in mapping:
        spans_of_type = get_spans_by_type(spans, type_)
        for span in spans_of_type:
            out += [{
                'id': span[3],
                'type': type_,
                'span': (span[1], span[2]),
                'span_length': span[2] - span[1]
            }]
    return out

# Creates 'edit' list for a sentence
def associate_spans(sent):
    edits = []

    # Extract metadata about each span
    orig_spans = get_span_metadata(sent['original_spans'])
    simp_spans = get_span_metadata(sent['simplified_spans'])

    # Get counts of each span type
    counts = count_edits(sent)
    for type_ in counts.keys():
        annotations = sent['annotations'][type_]
        for i in range(1, counts[type_]+1):
            # Get all spans corresponding to the ID
            orig_span = [x for x in orig_spans if x['id'] == i and x['type'] == type_]
            simp_span = [x for x in simp_spans if x['id'] == i and x['type'] == type_]

            # If the original or simplified span is missing (i.e. addition or deletion), fill in with dummy span
            orig_span = orig_span[0] if len(orig_span) > 0 else empty_span
            simp_span = simp_span[0] if len(simp_span) > 0 else empty_span

            # TODO: This only takes the first span. Need to support edit types which have multiple spans (splits, structure)

            # If the ID has no spans, skip
            if orig_span is empty_span and simp_span is empty_span:
                break
            
            # Compile spans into edit
            edits += [{
                'type': type_,
                'id': i-1,
                'original_span': orig_span['span'],
                'simplified_span': simp_span['span'],
                # 'original_span_length': orig_span['span_length'],
                # 'simplified_span_length': simp_span['span_length'],
                'annotation': annotations[i]
            }]
    return edits

# Creates 'edit' list for all sentences
def consolidate_edits(data):
    out = copy.deepcopy(data)
    for sent in out:
        sent['edits'] = associate_spans(sent)
    return out

def process_del_info(raw_annotation):
    # ex. ['perfect', 'no', 'no']
    rating, error_type = None, None
    rating, coreference, grammar_error = raw_annotation
    
    # Sometimes the interface glitches and you can't answer this question
    if grammar_error == '':
        grammar_error = 'no'

    rating, coreference, grammar_error = quality_mapping[rating], error_mapping[coreference], error_mapping[grammar_error]
    
    if coreference:
        error_type = Error.COREFERENCE
    
    return Quality.QUALITY, rating, error_type, grammar_error

def process_add_info(raw_annotation):
    # ex. ['trivial', 'no', '', ''], ['elaboration', 'minor', 'no'], ['repetition', 'somewhat', 'no']
    rating, error_type = None, None
    
    annotation_type = raw_annotation[0]
    if (annotation_type == 'elaboration'):
        edit_quality = Quality.QUALITY
        rating, grammar_error = raw_annotation[1:]
    elif (annotation_type == 'trivial'):
        helpful, rating, grammar_error = raw_annotation[1:]
        if helpful == 'yes':
            edit_quality = Quality.TRIVIAL
            rating = simplification_quality_mapping[rating]
        else:
            edit_quality = Quality.ERROR
            error_type = Error.UNNECESSARY_INSERTION
    else:
        edit_quality = Quality.ERROR
        if (annotation_type == 'hallucination'):
            error_type, irrelevancy, rating, grammar_error = raw_annotation
            if error_mapping[irrelevancy] == True:
                error_type = Error.IRRELEVANT
        else:
            error_type, rating, grammar_error = raw_annotation
            error_type = error_type_mapping[error_type]
        rating = severity_mapping[rating]
    
    grammar_error = error_mapping[grammar_error] if grammar_error != '' else False
    return edit_quality, rating, error_type, grammar_error


def process_same_info(annotation):
    # ex. (substitution) ['positive', 'a lot', 'minor', 'no']
    # ex. (reorder) ['negative', 'a lot', '', 'no', 'word']
    # ex. (structure) ['positive', '', 'a lot', 'no'], ['positive', '', 'somewhat', 'yes']
    edit_quality, pos_rating, neg_rating, grammar_error = annotation

    edit_quality, grammar_error = impact_mapping[edit_quality], error_mapping[grammar_error]
    error_type = None
    if edit_quality == Quality.QUALITY:
        rating = simplification_quality_mapping[pos_rating]
    elif edit_quality == Quality.ERROR:
        rating = severity_mapping[neg_rating]
        error_type = Error.COMPLEX_WORDING
    else:
        rating = None
    return edit_quality, rating, error_type, grammar_error

def process_diff_info(annotation):
    # ['very', 'no']
    rating, grammar_error = different_meaning_severity_mapping[annotation[0]], error_mapping[annotation[1]]
    return Quality.ERROR, rating, Error.INFORMATION_REWRITE, grammar_error

# So when coding the interface, substitutions follow the format:
# [quality, pos_rating, neg_rating, grammar_error]
# but syntax errors follow this format:
# [quality, neg_rating, pos_rating, grammar_error]
# this swaps the neg and pos for syntax errors
def swap_same_sub_fix(annotation):
    annotation[1], annotation[2] = annotation[2], annotation[1]

def process_annotation(edit):
    type_ = edit['type']
    raw_annotation = edit['annotation']

    information_impact = Information.SAME
    
    # Classify edit types into their information change
    if (type_ == 'deletion'):
        information_impact = information_mapping['less']
    elif (type_ == 'insertion'):
        information_impact = information_mapping['more']
    elif (type_ == 'substitution'):
        information_impact = information_mapping[raw_annotation[0]]
        raw_annotation = raw_annotation[1:]
    elif (type_ == 'reorder'):
        # need to incorporate reorder level into annotation somehow
        reorder_level = reorder_mapping[raw_annotation[-1]]
        raw_annotation = raw_annotation[:-1]
        swap_same_sub_fix(raw_annotation)
    elif (type_ == 'structure' or type_ == 'split'):
        swap_same_sub_fix(raw_annotation)
        pass

    # Process annotation based on information change
    if (information_impact == Information.LESS):
        edit_quality, rating, error_type, grammar_error = process_del_info(raw_annotation)
    elif (information_impact == Information.MORE):
        edit_quality, rating, error_type, grammar_error = process_add_info(raw_annotation)
    elif (information_impact == Information.DIFFERENT):
        edit_quality, rating, error_type, grammar_error = process_diff_info(raw_annotation)
    else:
        edit_quality, rating, error_type, grammar_error = process_same_info(raw_annotation)

    # For berevity, we simply set the error type to ERROR if any error exists
    if error_type is not None:
        edit_quality = Quality.ERROR

    return {
        'edit_type': type_,
        'id': edit['id'],
        'information_impact': information_impact,
        'type': edit_quality,
        'grammar_error': grammar_error,
        'error_type': error_type,
        'rating': rating
    }

def process_annotations(annotations):
    return [process_annotation(edit) for edit in annotations]

def consolidate_annotations(data):
    out = copy.deepcopy(data)
    for sent in out:
        sent['processed_annotations'] = process_annotations(sent['edits'])
    return out