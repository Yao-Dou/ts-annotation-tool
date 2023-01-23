Data is organized as follows:
- `batches` - Data provided TO annotators
- `annotated` - Data provided FROM annotators in the format: `batch_X_NAME.json`
- `preliminary` - Preliminary / onboarding data and annotations
    - `preliminary/tutorial` - Preliminary batch from all annotators
- `salsa` - Our released annotations
- `simp_eval` - SimpEval likert, direct assessment and rate+rank ratings for the full 60 sentences
- `automatic_metrics` - Automatic metric scores for full 60 sentences. Includes BLEU, SARI, BERTScore, COMET, LENS
- `edit_classification` - Data split for edit classification task
- `structure_inspection` - Data for manual inspection of structure changes (we didn't end up performing this inspection)

We also have an `injestion.ipynb` notebook, which converts raw annotations (in `annotated`) to our released annotations (in `salsa`).


### Old Notes
current 5 systems:  ["systems/asset.test.simp", 
                    "new_systems/asset.test.simp.second", 
                    "new_systems/turk_corpus_random.txt",
                    "systems/con_simplification.txt",
                    "systems/T5.txt"]
Each batch contains 50 instances, 10 from each system

odd number batches are done by Anton, Ayush, Kelly
even number batches are done by Rachel, Vinayak, Vishnesh


https://yao-dou.github.io/ts-annotation-tool/?batch=1&name=${first_name}

batch=1, includes batch_1 and batch_2

batch=2, includes batch_3 and batch_4

batch=3, represents new-wiki-1/part1 (35)
batch=4, represents new-wiki-1/part2 (30)