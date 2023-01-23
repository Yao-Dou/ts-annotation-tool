import json
import random
import openai
import csv
import copy

simp_eval_path = '../simp_eval/21_systems_annotations.csv'

prompt = "Please rewrite the following complex sentence in order to make it easier to understand by non-native speakers of English. You can do so by replacing complex words with simpler synonyms (i.e. paraphrasing), deleting unimportant information (i.e. compression), and/or splitting a long complex sentence into several simpler ones. The final simplified sentence needs to be grammatical, fluent, and retain the main ideas of its original counterpart without altering its meaning.\n\n%s"

few_shot_template = """
Examples: %s
"""

example_template = """
Input: %s
Output: %s
"""

input_template = """
Input: %s
Output:
"""

# Loads ASSET's 10 simplifications
def load_asset(path):
    with open(f'{path}/asset.test.orig', encoding='utf-8') as f:
        orig = f.read().splitlines()

    simplifications = []
    for i in range(10):
        with open(f'{path}/asset.test.simp.{i}', encoding='utf-8') as f:
            simplifications.append(f.read().splitlines())

    asset = {}

    counter = 0
    for sent in range(len(orig)):
        asset[counter] = {
            'original': orig[sent],
            'simplifications': [x[counter] for x in simplifications]
        }
        counter += 1
    
    return asset

# Randomly sample 5 ASSET sentences + 1 of their simplifications
def sample_asset(asset, num_samples=5):
    out = []
    for sample in random.sample(list(asset.items()), num_samples):
        out.append((sample[1]['original'], random.choice(sample[1]['simplifications'])))
    return out

# Load data
def load_batch(path):
    with open(path, encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        return [row for row in reader]


def create_few_shot_input(sent, asset, num_samples=5):
    example_text = ""
    for example in sample_asset(asset, num_samples=num_samples):
        example_text += (example_template % example)
    return (prompt[:-3] + (few_shot_template % example_text) + prompt[:-3] + (input_template % sent)[:-1])

# Although I have the original datasets, it's easiest to just use the SimpEval sentences
def load_multi_dataset(human_systems):
    with open(simp_eval_path) as f:
        reader = csv.reader(f)
        next(reader)
        simeval_sents = [{
            'original': row[2],
            'simplification': row[3],
            'system': row[4],
        } for row in reader if row[4] in human_systems]
    return simeval_sents

def sample_multi_dataset(multi_dataset_data, dataset_name, num_samples=5):
    dataset = [x for x in multi_dataset_data if x['system'] == dataset_name]
    out = []
    for sample in random.sample(dataset, num_samples):
        out.append((sample['original'], sample['simplification']))
    return out

def create_few_shot_input_multi_dataset(sent, multi_dataset_data, dataset_name, num_samples=5):
    example_text = ""
    for example in sample_multi_dataset(multi_dataset_data, dataset_name, num_samples=num_samples):
        example_text += (example_template % example)
    return (prompt[:-3] + (few_shot_template % example_text) + prompt[:-3] + (input_template % sent)[:-1])
