"""Build local-only search and curated relationships from the current handbook.
Run after editing handbook content: python tools/build-knowledge.py
Requires BeautifulSoup (authoring only; learners need just a browser).
"""
from pathlib import Path
from bs4 import BeautifulSoup
import json
D=Path(__file__).resolve().parents[1]
s=BeautifulSoup((D/'실습핸드북.html').read_text(),'html.parser')
sections=s.select('main > section');entries=[]
for section in sections:
 sid=section['id'];chapter=section.h2.get_text(' ',strip=True)
 active={'id':sid,'section':sid,'sectionTitle':chapter,'title':chapter,'kind':'설명','text':''};entries.append(active)
 for el in section.select('h3,p,li,pre,td,figcaption'):
  if el.find_parent(['textarea','button','script','style']):continue
  if el.find_parent(class_='note-field') or el.find_parent(attrs={'data-note-group':True}):continue
  if el.name in ['p','li','td'] and el.find_parent(['p','li','td']):continue
  if 'template-link' in el.get('class',[]):continue
  if el.name=='h3':
   active={'id':el['id'],'section':sid,'sectionTitle':chapter,'title':el.get_text(' ',strip=True),'kind':'설명','text':''};entries.append(active)
  elif el.name=='pre' and el.find_parent(class_='pb'):
   pb=el.find_parent(class_='pb');title=pb.select_one('.bar span').get_text(' ',strip=True)
   entries.append({'id':pb['id'],'section':sid,'sectionTitle':chapter,'title':title,'kind':'프롬프트','text':el.get_text()})
  elif not el.find_parent(class_='pb'):
   active['text']+=el.get_text(' ',strip=True)+'\n'
entries=[e for e in entries if e['text'].strip() or e['title']]
def target(section,word=''):
 sec=s.find(id=section)
 if word:
  h=next((h for h in sec.select('h3') if word in h.get_text()),None)
  if h:return h['id']
 return section
nodes=[]
def node(id,label,group,summary,section,word='',aliases=''):
 nodes.append(dict(id=id,label=label,group=group,summary=summary,target=target(section,word),aliases=aliases))
node('ai','AI','basic','글쓰기·예측 같은 일을 컴퓨터가 하게 하는 기술입니다.','glossary','AI·','인공지능')
node('ml','머신러닝','basic','여러 사례에서 패턴을 배웁니다. 판매 기록으로 수요를 예측하는 것이 한 예입니다.','glossary','AI·','machine learning 기계학습')
node('dl','딥러닝','basic','여러 층의 신경망으로 복잡한 패턴을 배우는 머신러닝입니다.','glossary','AI·','deep learning')
node('llm','LLM','basic','많은 글을 학습해 글과 코드를 만드는 언어 모델입니다.','glossary','AI·','대규모 언어모델 엘엘엠')
node('claude','Claude','basic','이 수업에서 대화하며 업무를 맡기는 AI입니다.','concept-agent','','클로드')
node('prompt','프롬프트','method','AI에게 어떤 자료로 무엇을 만들지 알려 주는 말입니다.','concept-vibe','부탁할 때','prompt 요청문 지시문')
node('meta','메타프롬프트','method','어떻게 부탁하면 좋을지 AI에게 질문하고 프롬프트 작성도 맡깁니다.','concept-vibe','무엇을 부탁할지','메타프롬프팅 meta prompt')
node('agent','에이전트','method','목표를 받아 도구로 작업하고 다음 행동을 고르는 AI입니다.','concept-agent','에이전트 ·','agent')
node('vibe','바이브 코딩','method','원하는 모습을 말하고 결과를 보며 만들고 다듬습니다.','concept-vibe','바이브 코딩 ·','vibe coding 카파시')
node('agentic','에이전틱 코딩','method','AI가 계획·파일 만들기·실행·확인을 이어 가며 도구를 만듭니다.','concept-agent','에이전틱 코딩','agentic coding')
node('context','컨텍스트','basic','AI가 지금 일을 위해 참고하는 자료와 대화입니다.','glossary','','context 맥락')
node('tokens','토큰','basic','AI가 글을 읽고 쓸 때 처리하는 조각입니다.','glossary','','token 사용량')
node('spec','스펙','method','필요한 기능과 완성됐는지 확인할 기준을 적습니다.','concept-vibe','강사 참고','spec driven 명세 요구사항')
node('prd','PRD','method','누구의 불편을 어떤 기능으로 해결할지 적는 문서입니다.','web','고객 한 명','요구사항 기획서')
node('ia','IA','method','찾기 쉽게 정보와 기능을 묶은 지도입니다.','web','고객 한 명','정보 구조 인포메이션 아키텍처')
node('journey','사용자 여정','method','사용자의 행동과 마음을 시간 순서로 살펴봅니다.','web','고객 한 명','user journey 유저 저니')
node('terminal','터미널','tool','글자로 프로그램을 켜는 창입니다. 여기서 Claude Code를 켭니다.','terminal','','powershell 파워셸 terminal')
node('code','Claude Code','tool','파일·코드·명령을 다뤄 업무 도구를 만드는 AI 작업 도구입니다.','install','','클로드코드 클로드 코드')
node('cowork','Cowork','tool','파일과 연결 도구로 업무 결과물을 만드는 Claude 사용 방식입니다.','concept-agent','','코워크')
node('skill','스킬','tool','한 번 정한 업무 절차를 다음 자료에도 꺼내 씁니다.','skill-create','','skill SKILL.md')
node('rules','CLAUDE.md','tool','AI에게 반복해서 알려 줄 규칙을 적는 파일입니다.','rules','','클로드md 클로드닷엠디 규칙')
node('subagent','서브에이전트','tool','일부 일을 나눠 맡고 결과를 돌려주는 AI 담당자입니다.','team','','sub-agent subagent 팀원')
node('harness','하네스','tool','AI가 일할 규칙·도구·역할·확인 방법을 갖춘 환경입니다.','rules','','harness 작업환경')
node('mcp','MCP','tool','AI와 외부 도구를 잇는 공통 연결 방식입니다.','mcp','','엠씨피 model context protocol')
node('connector','커넥터','tool','Gmail 같은 서비스를 연결해 쓰는 기능입니다.','mcp','','connector 연결')
node('api','API','tool','서비스와 데이터를 정해진 형식으로 주고받는 창구입니다.','glossary','','에이피아이')
node('plugin','플러그인','tool','스킬·도구 같은 기능을 더하는 묶음입니다.','glossary','','plugin 확장')
node('html','HTML','tool','브라우저에서 열어 보는 웹 화면 파일입니다.','first-tool','','웹페이지')
node('local','브라우저 저장','tool','같은 기기·같은 브라우저에서 기록을 다시 꺼내 씁니다.','first-tool','','localStorage 로컬 저장')
node('verify','직접 확인','method','만든 화면을 눌러 보고 숫자를 원본과 비교합니다.','m1check','','검증 테스트 확인')
node('checklist','체크리스트','practice','할 일을 추가하고 완료 표시한 뒤 다시 열어 봅니다.','first-tool','','할일 투두')
node('meeting','회의록','practice','내 기준으로 스킬을 만들고 두 회의 메모에 같은 방법을 씁니다.','skill-create','','미팅 요약')
node('customer','고객관리 앱','practice','필요한 기능을 질문받으며 고르고, 고객을 저장하고 다시 찾습니다.','web','','CRM 고객 도구')
node('report','비용 보고서','practice','Excel로 건수·총액·부서별 금액과 공유 문안을 만듭니다.','report','','엑셀 Excel 비용표')
node('reuse','다음 주 재사용','practice','새 비용표를 같은 방법으로 보고서로 만듭니다.','transfer','','주간 반복')
node('team','3명 팀','practice','자료 확인·작성·검수 담당자에게 나눠 맡깁니다.','team','','협업 팀 빌딩')
node('webreport','웹 보고서·슬라이드','practice','Excel 하나를 고르면 보고서와 발표 자료를 보는 웹 도구입니다.','auth-app','','발표 웹앱 대시보드')
node('watch','파일 자동 갱신','practice','감시를 켜 두면 입력 파일이 바뀔 때 보고서를 다시 만듭니다.','automation','','watch 감시 자동화')
node('gmail','Gmail 초안','practice','연결 도움을 받은 뒤 메일을 임시보관함에 저장하고 직접 봅니다.','mcp','','지메일 이메일 메일')
edges=[]
def edge(a,b,label):edges.append(dict(source=a,target=b,label=label))
for a,b,l in [
('ai','ml','AI를 구현하는 방법 중 하나'),('ml','dl','머신러닝의 한 방법'),('dl','llm','언어 모델을 만드는 데 활용'),('llm','claude','언어 모델의 한 예'),('claude','code','파일·코드 작업에 활용'),('claude','cowork','업무 파일 작업에 활용'),
('context','prompt','필요한 자료와 배경을 알려 줌'),('context','tokens','자료를 읽을 때 토큰을 사용'),('prompt','agent','목표와 원하는 결과를 전달'),('meta','prompt','질문에 답하며 함께 작성'),('prompt','vibe','말로 원하는 모습을 설명'),('vibe','checklist','작은 화면으로 처음 경험'),('agent','agentic','도구를 만드는 일에 적용'),('agentic','code','수업에서 사용하는 작업 도구'),('terminal','code','프로그램을 켜는 창'),
('spec','agentic','만들 기능과 확인 기준을 안내'),('spec','prd','만들 것을 적는 문서로 구체화'),('prd','ia','필요한 정보와 기능을 묶어 봄'),('prd','journey','사용할 상황과 과정을 함께 봄'),('prd','customer','고객 앱의 기능을 정함'),('ia','customer','고객 추가와 목록을 묶음'),('journey','customer','기록하고 다시 찾는 과정을 봄'),
('code','skill','반복 업무 절차를 불러 씀'),('code','rules','작업 규칙을 참고'),('agent','subagent','일부 일을 나눠 맡김'),('subagent','team','세 역할로 나눠 실습'),('harness','rules','반복해서 지킬 규칙'),('harness','skill','꺼내 쓰는 작업 절차'),('harness','subagent','일을 나눠 맡는 담당자'),('harness','mcp','외부 도구를 연결하는 방식'),('harness','verify','결과를 확인하는 기준'),('plugin','skill','스킬을 묶어 배포할 수 있음'),('plugin','mcp','도구 연결 설정을 포함할 수 있음'),
('mcp','connector','공통 방식을 이용해 서비스 연결'),('connector','api','서비스 API를 이용할 수 있음'),('connector','gmail','Gmail 사용을 연결'),('code','mcp','외부 도구를 사용하도록 연결'),
('html','checklist','브라우저에 화면을 표시'),('local','checklist','할 일과 완료 표시를 남김'),('local','customer','고객 기록을 다시 꺼내 씀'),('skill','meeting','회의록 정리 방법을 재사용'),('skill','report','비용 보고 절차를 재사용'),('report','reuse','다음 주 파일에도 같은 방법'),('report','team','확인·제작·검수로 나눠 맡김'),('report','webreport','버튼으로 쓰는 웹 도구로 확장'),('webreport','html','보고서 화면을 브라우저에서 봄'),('report','watch','파일 변경 때 다시 만들기'),('report','gmail','보고 내용을 메일 초안으로 공유'),('verify','checklist','추가·완료·새로고침을 눌러 봄'),('verify','report','건수와 합계를 원본과 비교'),('verify','gmail','임시보관함에서 초안을 직접 봄'),('rules','reuse','다음 작업에도 기준을 참고')]:edge(a,b,l)
ids={n['id'] for n in nodes}
assert all(e['source'] in ids and e['target'] in ids for e in edges)
assert all(s.find(id=n['target']) for n in nodes)
for e in entries:assert s.find(id=e['id'])
data=dict(version=1,nodes=nodes,edges=edges,entries=entries,sections=[dict(id=x['id'],title=x.h2.text) for x in sections])
(D/'assets/knowledge-data.js').write_text('/* Generated by tools/build-knowledge.py. Public course content only; never learner notes. */\nwindow.CourseKnowledge = '+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n')
print(f'{len(nodes)} nodes, {len(edges)} described edges, {len(entries)} search entries')
