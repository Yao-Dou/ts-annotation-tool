from names import *

content_errors = [
    Error.HALLUCINATION,
    Error.CONTRADICTION,
    Error.REPETITION,
    Error.IRRELEVANT,
    Error.COREFERENCE,
    Error.INFORMATION_REWRITE
]

# Scores for "good" edits (excl. less info)
rating_mapping_simplification = {
    0: 1,
    1: 4,
    2: 9
}

# Scores for less info
rating_mapping_deletion = {
    0: -4,
    1: -1,
    2: 1,
    3: 4
}

# Scores for errors
rating_mapping_error = {
    0: 1,
    1: 4,
    2: 9,
    3: 16
}

def calculate_annotation_score(annotation, parameters):
    edit_score = 0

    # This will only be null for 'no impact' same info and bad trivial insertions
    if annotation['rating'] != None and annotation['rating'] != '':
        if annotation['type'] == Quality.ERROR:
            edit_score = rating_mapping_error[annotation['rating']]
        elif annotation['information_impact'] == Information.LESS:
            edit_score = rating_mapping_deletion[annotation['rating']]
        elif annotation['information_impact'] == Information.MORE or annotation['information_impact'] == Information.SAME:
            edit_score = rating_mapping_simplification[annotation['rating']]
    
    # Add bonuses for good edits
    if annotation['type'] == Quality.QUALITY or annotation['type'] == Quality.TRIVIAL:
        impact = annotation['information_impact']
        if impact == Information.LESS:
            # good deletion
            edit_score *= parameters['good_deletion']
        elif impact == Information.MORE:
            if annotation['type'] == Quality.TRIVIAL:
                # good trivial insertion
                edit_score *= parameters['good_trivial_insertion']
            elif annotation['type'] == Quality.QUALITY:
                # good insertion
                edit_score *= parameters['good_insertion']
        elif impact == Information.SAME:
            if annotation['edit_type'] == 'substitution':
                # good paraphrase
                edit_score *= parameters['good_paraphrase']
            else:
                # good syntax change
                edit_score *= parameters['good_syntax']

    # Unnecessary insertions have no severity...
    if annotation['error_type'] == Error.UNNECESSARY_INSERTION:
        # Assigning it to a 'somewhat' severity error
        edit_score = 2

    if annotation['grammar_error'] == True:
        edit_score = abs(edit_score) * parameters['grammar_error']

    if annotation['error_type'] in content_errors:
        edit_score = abs(edit_score) * parameters['content_error']

    # Calculate the annotation size
    annotation_size = annotation['size']
    # Less distinction between large edits
    if parameters['size_calculation'] == 'log':
        annotation_size = 1 + math.log10(annotation_size + 0.1)
    elif parameters['size_calculation'] == 'square':
        annotation_size = annotation_size*annotation_size
    elif parameters['size_calculation'] == 'none':
        annotation_size = 1
    
    return edit_score * annotation_size

def calculate_sentence_score(sent, parameters):
    # Calculate the score of each annotation
    for annotation in sent['processed_annotations']:
        annotation['score'] = calculate_annotation_score(annotation, parameters)
    
    # Simply sum the scores for each annotation
    return sum(annotation['score'] for annotation in sent['processed_annotations'])

def calculate_sentence_scores(data, parameters):
    out = copy.deepcopy(data)
    for sent in out:
        sent['score'] = calculate_sentence_score(sent, parameters)
    return out

