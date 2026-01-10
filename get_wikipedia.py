import re
import os
import unicodedata

def clean_pinyin(text):
    """Retire les tons du pinyin et les suffixes administratifs pour Wikipedia FR."""
    if not text: return ""
    suffixes = [" Shěng", " Shì", " Zìzhìqū", " Zhuàngzú", " Wéiwú'ěr"]
    for s in suffixes:
        text = text.replace(s, "")
    text = unicodedata.normalize('NFD', text)
    text = "".join([c for c in text if unicodedata.category(c) != 'Mn'])
    return text.strip().replace(" ", "_")

def update_js_file(filepath, is_province=False):
    if not os.path.exists(filepath):
        print(f"Fichier non trouvé : {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacement_logic(match):
        full_match = match.group(0)
        pinyin = match.group(1)
        clean = clean_pinyin(pinyin)
        
        wiki_url = f"https://fr.wikipedia.org/wiki/{clean}"
        summary_api = f"https://fr.wikipedia.org/api/rest_v1/page/summary/{clean}"
        
        # On vérifie si les champs existent déjà pour ne pas les doubler, 
        # sinon on les ajoute après le pinyin
        new_fields = f'"pinyin": "{pinyin}",\n        "wiki_url": "{wiki_url}",\n        "wiki_summary": "{summary_api}"'
        
        # Remplacement de la ligne pinyin par pinyin + nouveaux champs
        pattern = rf'"pinyin":\s*"{re.escape(pinyin)}"(,\n)?'
        return re.sub(pattern, new_fields + ",", full_match)

    # Regex pour identifier les blocs contenant un pinyin
    if is_province:
        # Pour provinces.js (Format "Nom": { ... })
        updated_content = re.sub(r'"pinyin":\s*"([^"]+)"', replacement_logic, content)
        # Si ",," est ajouté en trop, on le remplace par une seule virgule
        updated_content = re.sub(r',,\n', ',\n', updated_content)
    else:
        # Pour cities.js (Format { "name": ..., "pinyin": ... })
        updated_content = re.sub(r'"pinyin":\s*"([^"]+)"', replacement_logic, content)
        updated_content = re.sub(r',,\n', ',\n', updated_content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print(f"Mis à jour : {filepath}")

def main():
    update_js_file("data/provinces.js", is_province=True)
    update_js_file("data/cities.js", is_province=False)

if __name__ == "__main__":
    main()