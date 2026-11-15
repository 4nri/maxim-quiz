"""Rebuild source paragraphs from the supplied, locally retained DOCX."""
import json
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

root = Path(__file__).resolve().parent.parent
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(root / 'in/КВИЗ.docx') as z:
    doc = ET.fromstring(z.read('word/document.xml'))
paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', ns)) for p in doc.findall('.//w:p', ns)]
starts = [0,22,37,50,75,88,118,148,165,191,223,245,269,292,325,352,371,400,len(paragraphs)]
urls = [5096,5114,811,5175,5177,5122,5102,4901,5216,5227,5214,5228,5113,5355,5090,5290,5248,5226]
short = ['Пётр Карелов','Николай Цицин','Леонид Сенцов','Софья Мешалина','Вячеслав Безяев','Ким Филби','Николай Панков','Улица Дмитриевского','Дмитрий Барилов','Мемориал в Румянцеве','Танковый музей','Георгий Жуков','Александр Безкровный','Герои семьи Андреевых','Евгений Пепеляев','Дмитрий Подскрёбышев','Третьяковская галерея','Морозовская больница']
topics = []
for i, start in enumerate(starts[:-1]):
    topics.append({'id':i+1,'title':paragraphs[start],'short':short[i],'url':f'https://moiraion.moscow/list/{urls[i]}','paragraphs':[p for p in paragraphs[start+1:starts[i+1]] if p.strip()]})
target = root / 'data.json'
data = json.loads(target.read_text()) if target.exists() else {}
data['topics'] = topics
target.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
print(f'Imported {len(topics)} topics')
