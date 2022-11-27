import copy
import math
import os
import json
import csv
from util import *
from types import *
from scoring import *

# File paths
simp_eval_json_path = '../simp_eval/21_systems_annotations.csv'

# Specify metadata for an empty span
empty_span = {
    'span': None,
    'span_length': None
}

# Maps raw annotation outputs to enums or numbers
mapping = {
    'deletion': 0,
    'substitution': 1,
    'insertion': 3,
    'split': 2,
    'reorder': 4,
    'structure': 5
}
    
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

error_mapping = {
    'yes': True,
    'no': False
}

impact_mapping = {
    'negative': Quality.ERROR,
    'no': Quality.TRIVIAL,
    'positive': Quality.QUALITY
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
        if counts[type_] != 0 and counts[type_] + 1 > len(annotations):
            print(f'{get_sent_info(sent)} has {counts[type_]} {type_} edits but {len(annotations) - 1} annotations. Likely a missing annotation. Skipping edit type...')
            edits += []
            continue
        for i in range(1, counts[type_]+1):
            # Get all spans corresponding to the ID
            orig_span = [x for x in orig_spans if x['id'] == i and x['type'] == type_]
            simp_span = [x for x in simp_spans if x['id'] == i and x['type'] == type_]

            # If the original or simplified span is missing (i.e. addition or deletion), fill in with dummy span
            orig_span = orig_span if len(orig_span) > 0 else empty_span
            simp_span = simp_span if len(simp_span) > 0 else empty_span

            # If the ID has no spans, skip
            if orig_span is empty_span and simp_span is empty_span:
                continue
                
            # Convert list of dicts to list of spans, retaining None value if necessary
            orig_span = [x['span'] for x in orig_span] if orig_span is not empty_span else None
            simp_span = [x['span'] for x in simp_span] if simp_span is not empty_span else None
            
            # Compile spans into edit
            edits += [{
                'type': type_,
                'id': i-1,
                'original_span': orig_span,
                'simplified_span': simp_span,
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

    # Deal with annotators sometimes not filling out all fields
    if grammar_error == '':
        # print(f"Couldn't process grammar for deletion: {raw_annotation}. Assuming 'no'...")
        grammar_error = 'no'
    if coreference == '':
        # print(f"Couldn't process coreference error for deletion: {raw_annotation}. Assuming 'no'...")
        coreference = 'no'

    rating, grammar_error, coreference = quality_mapping[rating], error_mapping[coreference], error_mapping[grammar_error]
    
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
        rating = simplification_quality_mapping[rating]
    elif (annotation_type == 'trivial'):
        helpful, rating, grammar_error = raw_annotation[1:]
        if helpful == 'yes':
            edit_quality = Quality.TRIVIAL
            rating = simplification_quality_mapping[rating]
        else:
            edit_quality = Quality.ERROR
            error_type = Error.UNNECESSARY_INSERTION

            # If an annotator sets a rating, then says 'no', the rating is still there
            # therefore, we should ignore this rating
            rating = None
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


def process_same_info(raw_annotation):
    # ex. (substitution) ['positive', 'a lot', 'minor', 'no']
    # ex. (reorder) ['negative', 'a lot', '', 'no', 'word']
    # ex. (structure) ['positive', '', 'a lot', 'no'], ['positive', '', 'somewhat', 'yes']
    edit_quality, pos_rating, neg_rating, grammar_error = raw_annotation

    # Deal with annotators sometimes not filling out all fields
    if grammar_error == '':
        # print(f"Couldn't process grammar for substitution: {raw_annotation}. Assuming 'no'...")
        grammar_error = 'no'
        if pos_rating == '':
            print(f"Couldn't process positive rating for substitution: {raw_annotation}. Assuming 'somewhat'...")
            pos_rating = 'somewhat'
  
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

def process_diff_info(raw_annotation):
    # ['very', 'no']
    rating, grammar_error = different_meaning_severity_mapping[raw_annotation[0]], error_mapping[raw_annotation[1]]
    return Quality.ERROR, rating, Error.INFORMATION_REWRITE, grammar_error

# So when coding the interface, substitutions follow the format:
# [quality, pos_rating, neg_rating, grammar_error]
# but syntax errors follow this format:
# [quality, neg_rating, pos_rating, grammar_error]
# this swaps the neg and pos for syntax errors
def swap_same_sub_fix(annotation):
    annotation[1], annotation[2] = annotation[2], annotation[1]

def calculate_edit_length(original_span, simplified_span):
    orig_len, simp_len = 0, 0
    if original_span is not None:
        for span in original_span:
            orig_len = span[1] - span[0]
    if simplified_span is not None:
        for span in simplified_span:
            simp_len = span[1] - span[0]
    return abs(simp_len - orig_len)

def process_annotation(edit):
    edit_type = edit['type']
    raw_annotation = edit['annotation']

    if raw_annotation == '' or raw_annotation is None:
        raise Exception(f'Could not process edit: {edit}')

    information_impact = Information.SAME
    
    # Classify edit types into their information change
    if (edit_type == 'deletion'):
        information_impact = information_mapping['less']
    elif (edit_type == 'insertion'):
        information_impact = information_mapping['more']
    elif (edit_type == 'substitution'):
        information_impact = information_mapping[raw_annotation[0]]
        raw_annotation = raw_annotation[1:]
    elif (edit_type == 'reorder'):
        # TODO: need to incorporate reorder level into annotation somehow
        reorder_level = reorder_mapping[raw_annotation[-1]] if raw_annotation[-1] != '' else None
        raw_annotation = raw_annotation[:-1]
        swap_same_sub_fix(raw_annotation)
    elif (edit_type == 'structure' or edit_type == 'split'):
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

    # Determine the family of edit based on edit type and information change
    edit_family = None
    if information_impact != Information.SAME:
        edit_family = Family.CONTENT
    elif edit_type == 'substitution':
        edit_family = Family.LEXICAL
    else:
        edit_family = Family.SYNTAX


    # Get the length of the edit
    size = calculate_edit_length(edit['original_span'], edit['simplified_span'])

    return {
        'edit_type': edit_type,
        'id': edit['id'],
        'information_impact': information_impact,
        'type': edit_quality,
        'family': edit_family,
        'grammar_error': grammar_error,
        'error_type': error_type,
        'rating': rating,
        'size': size,
    }

# def process_annotations(annotations):
#     return [process_annotation(edit) for edit in annotations]

def consolidate_annotations(data):
    out = copy.deepcopy(data)
    idx = 0
    while idx < len(out):
        sent = out[idx]
        processed = []
        successful = True
        for edit in sent['edits']:
            try: 
                processed.append(process_annotation(edit))
            except Exception as e:
                print(f'When processing sentence: {get_sent_info(sent)}. Caught error on: {e}. Skipping...')
                successful = False
        
        # Delete the sentence if we could not process the annotations for it
        if not successful:
            del out[idx]
            continue
        
        sent['processed_annotations'] = processed

        # Create a new entry for the 'length-normalized' size of the edit
        for i in range(len(sent['processed_annotations'])):
            sent['processed_annotations'][i]['size'] /= len(sent['original'])
        
        out[idx] = sent
        idx += 1
    return out

def add_simpeval_scores_json(data):
    # Add SimpEval scores to data ('simpeval_scores' field)
    out = copy.deepcopy(data)
    simpeval = []
    files = [i for j in [[f'../simpeval/{x}/{y}' for y in os.listdir('../simpeval/'+x)] for x in os.listdir('../simpeval/')] for i in j]
    for filename in files:
        with open(filename) as f:
            individual_annotation = json.load(f)
            simpeval += individual_annotation
    for i in range(len(out)):
        sent = out[i]
        system = sent['system']
        simpeval_sents = [entry for entry in simpeval if entry['Original'] == sent['original']]
        final = []
        for entry in simpeval_sents:
            for sentence_type in ['Deletions', 'Paraphrases', 'Splittings']:
                for entry_sent in entry[sentence_type]:
                    if entry_sent[2] == system:
                        final.append({'sentence_type': sentence_type.lower(), 'score': entry_sent[0], 'spans': entry_sent[3:]})
        scores = [x['score'] for x in final]
        out[i]['simpeval_scores'] = scores
    return out
    
def add_simpeval_scores(data, json=False):
    # JSON will get the scores from the original simpeval files
    if (json):
        return add_simpeval_scores_json(data)

    with open(simp_eval_json_path) as f:
        reader = csv.reader(f)
        next(reader)
        simeval_sents = [row[2:13] for row in reader]

    out = copy.deepcopy(data)
    for i in range(len(out)):
        sent = out[i]
        simpeval_scores = [entry for entry in simeval_sents if entry[0] == sent['original'] and entry[2] == sent['system']]
        if len(simpeval_scores) != 0:
            scores = [0][7:]
            scores = [float(x) for x in scores]
            out[i]['simpeval_scores'] = scores
    return out

def load_data(path, batch_num=None, preprocess=False, realign_ids=True):
    data = []

    if not 'annotated' in path:
        raise Exception('Currently only supports format of \"annotated\" files.')

    files = [f'{path}/{x}' for x in os.listdir(path)]

    files = sorted(files)

    # Only include files of a single batch
    if (batch_num is not None):
        selected_files = []
        for num in batch_num:
            selected_files.extend([x for x in files if ('batch_' + str(num)) in x])
        files = selected_files

    # Exclude corrupted file
    files = [x for x in files if 'batch_2_rachel' not in x]

    print(f'Loading files: {files}\n')

    # Add file and append user's name
    id_counter = 0
    batches = set([int(x.split('.')[-2].split('_')[-2]) for x in files])
    for batch_num in batches:
        for filename in [x for x in files if ('batch_' + str(batch_num)) in x]:
            with open(filename, encoding='utf-8') as f:
                individual_annotation = json.load(f)
                for entry in individual_annotation:
                    entry['user'] = filename.split('.')[-2].split('_')[-1]
                    entry['batch'] = batch_num
                    entry['hit_id'] = entry['id']
                    entry['id'] += id_counter
                data += individual_annotation
        id_counter += len(individual_annotation)

    # ID is used to identify unique sentences, this WAS okay in the past because
    # each batch was the same ordering, but now that batches are randomized, this
    # needs to be re-done once sentences are loaded
    # Really should be grouped by original and system, because two systems could have the same simplification
    if realign_ids:
        unique_sents = [sent['simplified'] for sent in data]
        unique_sents = [i for n, i in enumerate(unique_sents) if i not in unique_sents[:n]] # remove duplicates while retaining ordering
        new_data = []
        for i in range(len(unique_sents)):
            sents = sorted([sent for sent in data if sent['simplified'] == unique_sents[i]], key=lambda x: x['user'])
            for sent in sents:
                sent['id'] = i
            new_data.extend(sents)
        data = new_data

    print(f'Found users: {set([sent["user"] for sent in data])}\n')

    if preprocess:
        data = consolidate_edits(data)                      # Adds 'edits' field
        data = consolidate_annotations(data)                # Adds 'processed_annotations' field
        data = add_simpeval_scores(data)                    # Adds 'simpeval_scores' field. Can optionally not take the z-score normalized scores with "json=True"
        data = calculate_sentence_scores(data)              # Adds 'score' field
    
    return data
