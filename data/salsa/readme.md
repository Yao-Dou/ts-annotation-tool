We have 3 available corpora, organized by their original source. Each annotation is as follows:
```
{
    "id": X,                        // unique id for each annotation
    "annotation_id": X,             // original id for each annotation
    "sentence_id": X,               // unique id for each simplification (sentence/simplification pair)
    "batch": X,                     // batch number used when collecting the simplification
    "hit_id": X,                    // which HIT number was provided to the annotator
    "user": "annotator-X",          // unique id for annotator
    "system": "source/simplified",  // unique id for system writing simplification
    "original": "...",
    "simplified": "...",
    "original_spans": [             // selected edits in original sentence
        // spans in original sentence
        ...
    ],
    "simplified_spans": [           // selected edits in simplified sentence
        // spans in simplified sentence
        ...
    ],
    "annotations": {                // annotations for each edit type
        "deletion": [...],
        "substitution": [...],
        "insertion": [...],
        "split": [...],
        "reorder": [...],
        "structure": [...],
    }
}
```

Systems are formatted as `[original source]/[simplified source]`. For example, `simpeval-22/Muss` is simplifications on the SimpEval_2022 corpus written by MUSS.

Our source corpora are as follows:
- 28 sentences from `turkcorpus`: Turk Corpus (Same original sentences as ASSET)
- 60 sentences from `simpeval-22`: SimpEval_2022
- 40 sentences from `simpeval-ext`: Our extended SimpEval corpus

For each sentence, we collect 3 annotations from 7 systems:
- `Muss`
- `T5-3B`
- `T5-11B`
- `GPT-3-zero-shot`
- `GPT-3-few-shot`
- `Human-1-written`
- `Human-2-written`

`GPT-3` refers to `text-davninci-003`, with prompts in the `gpt-3` folder.

We had 6 undergradute annotators, and have anonymized their names.

We also include our preliminary annotations, which we collected while finalizing our systems. These are on the simpler TurkCorpus sentences for the following systems:
- `con_simplification.txt` - Controllable simplification model from NAACL '21
- `T5.txt` - Fine-tuned T5
- `turk_corpus_random.txt` - Simplified TurkCorpus sentences
- `asset.test.simp` - Human written simplification from ASSET
- `asset.test.simp.second` - Another ASSET simplification