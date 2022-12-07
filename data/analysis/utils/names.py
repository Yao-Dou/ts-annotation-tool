from enum import Enum

class Edit(Enum):
    DELETION = 'Deletion'
    INSERTION = 'Insertion'
    SUBSTITUTION = 'Substitution'
    REORDER = 'Reorder'
    STRUCTURE = 'Structure'
    SPLIT = 'Split'

class Information(Enum):
    LESS = 'Generalization'
    SAME = 'Same Information'
    MORE = 'Elaboration'
    DIFFERENT = 'Different Information'

class Error(Enum):
    # Explicit Content Errors
    COREFERENCE = 'Coreference'
    REPETITION = 'Repetition'
    CONTRADICTION = 'Contradiction'
    HALLUCINATION = 'Hallucination'
    IRRELEVANT = 'Irrelevant'
    INFORMATION_REWRITE = 'Information Rewrite'
    # Implicit Content Errors
    BAD_DELETION = 'Bad Deletion'
    # Structure Errors
    BAD_REORDER = 'Bad Reorder'
    BAD_STRUCTURE = 'Bad Structure'
    BAD_SPLIT = 'Bad Split'
    # Lexical Errors
    UNNECESSARY_INSERTION = 'Unnecessary Insertion'
    COMPLEX_WORDING = 'Complex Wording'

class Family(Enum):
    CONTENT = 'Content'
    SYNTAX = 'Syntax'
    LEXICAL = 'Lexical'

class Quality(Enum):
    QUALITY = 'No Error'
    TRIVIAL = 'Trivial'
    ERROR = 'Error'

class ReorderLevel(Enum):
    WORD = 'Word-level'
    COMPONENT = 'Component-level'