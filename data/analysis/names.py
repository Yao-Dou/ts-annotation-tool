from names import *
from enum import Enum

class Edit(Enum):
    DELETION = 'Deletion'
    INSERTION = 'Insertion'
    SUBSTITUTION = 'Substitution'
    REORDER = 'Reorder'
    STRUCTURE = 'Structure'
    SPLIT = 'Split'

class Information(Enum):
    LESS = 'Less Information'
    SAME = 'Same Information'
    MORE = 'More Information'
    DIFFERENT = 'Different Information'

class Error(Enum):
    COREFERENCE = 'Coreference'
    INFORMATION_REWRITE = 'Information Rewrite'
    REPETITION = 'Repetition'
    CONTRADICTION = 'Contradiction'
    HALLUCINATION = 'Hallucination'
    IRRELEVANT = 'Irrelevant'
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