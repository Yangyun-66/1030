from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.section import WD_SECTION

OUT = r'C:\Users\ncucc\Desktop\jelena1030\個人行程與任務管理系統_PRD.docx'
doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(.72); sec.bottom_margin = Inches(.68)
sec.left_margin = Inches(.78); sec.right_margin = Inches(.78)

GREEN = '285C4D'; LIGHT = 'E9F3ED'; PALE = 'F5F8F5'; GRAY = '5D6A64'; BORDER='D9E1DB'
styles = doc.styles
for style_name in ['Normal','Title','Subtitle','Heading 1','Heading 2']:
    s=styles[style_name]
    s.font.name='Microsoft JhengHei'
    s._element.rPr.rFonts.set(qn('w:eastAsia'),'Microsoft JhengHei')
    s.font.color.rgb=RGBColor(0,0,0)
styles['Normal'].font.size=Pt(10)
styles['Normal'].paragraph_format.space_after=Pt(5)
styles['Normal'].paragraph_format.line_spacing=1.15
styles['Title'].font.size=Pt(28); styles['Title'].font.bold=True
styles['Title'].paragraph_format.space_after=Pt(5)
title_ppr=styles['Title']._element.get_or_add_pPr()
title_border=title_ppr.find(qn('w:pBdr'))
if title_border is not None: title_ppr.remove(title_border)
styles['Subtitle'].font.size=Pt(12); styles['Subtitle'].font.color.rgb=RGBColor.from_string(GRAY)
styles['Heading 1'].font.size=Pt(16); styles['Heading 1'].font.bold=True
styles['Heading 1'].paragraph_format.space_before=Pt(14); styles['Heading 1'].paragraph_format.space_after=Pt(6)
styles['Heading 2'].font.size=Pt(12); styles['Heading 2'].font.bold=True
styles['Heading 2'].paragraph_format.space_before=Pt(9); styles['Heading 2'].paragraph_format.space_after=Pt(4)

def shade(cell, fill):
    pr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),fill); pr.append(shd)
def set_cell_border(cell):
    tcPr=cell._tc.get_or_add_tcPr(); borders=tcPr.first_child_found_in('w:tcBorders')
    if borders is None: borders=OxmlElement('w:tcBorders'); tcPr.append(borders)
    for edge in ('top','left','bottom','right','insideH','insideV'):
        tag='w:'+edge; el=borders.find(qn(tag))
        if el is None: el=OxmlElement(tag); borders.append(el)
        el.set(qn('w:val'),'single'); el.set(qn('w:sz'),'5'); el.set(qn('w:color'),BORDER)
def set_repeat_table_header(row):
    trPr=row._tr.get_or_add_trPr(); el=OxmlElement('w:tblHeader'); el.set(qn('w:val'),'true'); trPr.append(el)
def table(headers, rows, widths=None, font_size=9):
    t=doc.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
    if widths:
        for col,w in zip(t.columns,widths): col.width=Inches(w)
    set_repeat_table_header(t.rows[0])
    for i,h in enumerate(headers):
        c=t.rows[0].cells[i]; c.text=h; shade(c,GREEN); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        for p in c.paragraphs:
            p.paragraph_format.space_after=Pt(1)
            for r in p.runs: r.font.bold=True; r.font.color.rgb=RGBColor(255,255,255); r.font.size=Pt(font_size); r.font.name='Microsoft JhengHei'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Microsoft JhengHei')
        set_cell_border(c)
    for ridx,row in enumerate(rows):
        cells=t.add_row().cells
        for i,val in enumerate(row):
            c=cells[i]; c.text=str(val); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if widths: c.width=Inches(widths[i])
            if ridx%2: shade(c,PALE)
            for p in c.paragraphs:
                p.paragraph_format.space_after=Pt(2); p.paragraph_format.line_spacing=1.08
                for r in p.runs: r.font.size=Pt(font_size); r.font.name='Microsoft JhengHei'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Microsoft JhengHei')
            set_cell_border(c)
    doc.add_paragraph().paragraph_format.space_after=Pt(1)
    return t
def para(text='', boldlead=None):
    p=doc.add_paragraph()
    if boldlead and text.startswith(boldlead):
        p.add_run(boldlead).bold=True; p.add_run(text[len(boldlead):])
    else: p.add_run(text)
    return p
def bullets(lines):
    for line in lines:
        p=doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after=Pt(2); p.add_run(line)

# Title block
p=doc.add_paragraph(style='Title'); p.add_run('個人行程與任務管理系統')
p=doc.add_paragraph(style='Subtitle'); p.add_run('產品需求規格書 PRD')
p=doc.add_paragraph(); p.paragraph_format.space_before=Pt(8); p.paragraph_format.space_after=Pt(12)
r=p.add_run('版本 1.0  ｜  狀態 初步需求稿  ｜  日期 2026 年 10 月 30 日'); r.font.size=Pt(9); r.font.color.rgb=RGBColor.from_string(GRAY)
para('本文件定義一套支援手機與桌面的個人安排工具，聚焦在今日可執行的行程與待辦、月曆瀏覽、頁面內提醒，以及每日習慣打卡。此版本依目前已確認的需求編寫，未確認的產品決策列於文件末段。')

doc.add_heading('1 產品概述', level=1)
para('產品目標是讓個人使用者能快速掌握今天的安排、查看日期分布、完成待辦並維持日常習慣。主要入口採「今日清單＋月曆」雙視圖，讓每日執行與跨日規劃可互相連動。')
table(['項目','說明'],[
 ['產品型態','響應式個人行程與任務管理系統，支援手機及桌面瀏覽器。'],
 ['目標使用者','需要集中管理個人行程、待辦、提醒與習慣的個人使用者。'],
 ['主要價值','快速掌握今天；按日期查看前幾項安排；以勾選完成任務與習慣。'],
 ['原型狀態','HTML、CSS、JavaScript 單頁互動原型；資料目前為前端示範資料。'],
], [1.35,5.8])

doc.add_heading('2 目標與衡量方式', level=1)
bullets([
 '讓使用者在單一畫面查看所選日期的行程與待辦，並能快速新增、完成或刪除項目。',
 '讓使用者在月曆上辨認有安排的日期，點選日期後查看當日預覽與完整清單。',
 '讓使用者以每日勾選方式記錄習慣，不增加複雜的量化追蹤流程。',
 '建議後續以任務完成率、建立項目所需時間、提醒查看率及習慣打卡率作為產品指標；目標值待產品驗證後訂定。',
])

doc.add_heading('3 使用情境與需求範圍', level=1)
doc.add_heading('主要使用情境', level=2)
bullets([
 '早上開啟系統，查看今日行程、待辦、提醒與完成進度。',
 '從月曆點選其他日期，確認當天前幾項安排，再檢視完整清單。',
 '建立一次性的行程或待辦，指定日期與時間；待辦可設定截止日期及優先順序。',
 '完成待辦或每日習慣時勾選狀態；需要移除項目時使用刪除操作。',
])
doc.add_heading('本期範圍', level=2)
table(['納入','暫不納入／未確認'],[
 ['今日清單、月曆、行程、待辦、頁面內提醒、每日習慣打卡、項目新增與刪除。','重複行程／任務、推播或電子郵件通知、跨裝置同步、帳號與多人協作、資料匯出。'],
], [3.55,3.6])

doc.add_heading('4 功能需求', level=1)
table(['ID','功能','需求描述','優先級'],[
 ['F-01','今日清單','顯示所選日期的行程與待辦，依時間排序；顯示類型、時間、任務截止日期及高優先標示。','Must'],
 ['F-02','完成狀態','使用者可勾選／取消勾選待辦完成狀態；今日區域同步顯示已完成數與進度。','Must'],
 ['F-03','新增項目','可新增行程或待辦，填寫名稱、日期、時間、優先順序及頁面提醒設定。','Must'],
 ['F-04','刪除項目','每個清單項目提供刪除操作；刪除前顯示確認提示，確認後由清單及月曆預覽移除。','Must'],
 ['F-05','月曆瀏覽','顯示月曆並支援月份切換；有項目的日期顯示最多三個視覺標記。','Must'],
 ['F-06','每日預覽','選取月曆日期後，顯示日期及當日最多前三項內容；完整項目顯示於今日清單。','Must'],
 ['F-07','頁面內提醒','畫面顯示提醒提示，提供關閉操作；新增表單可選擇是否在項目開始時提醒。','Must'],
 ['F-08','習慣打卡','每日習慣以核取方塊記錄完成／未完成，畫面展示連續紀錄或本週概況。','Must'],
 ['F-09','日期切換','可由今日清單前後切換日期；選取月曆日期時同步更新清單與預覽。','Should'],
 ['F-10','響應式導覽','桌面使用側邊導覽；窄螢幕使用底部導覽，主要功能可觸控操作。','Must'],
], [.55,1.05,4.65,.9], 8)

doc.add_heading('5 主要流程', level=1)
doc.add_heading('新增行程或待辦', level=2)
para('使用者點選「新增項目」→ 輸入名稱 → 選擇行程或待辦 → 指定日期、時間與優先順序 → 設定頁面提醒與否 → 儲存後回到該日期，清單與月曆標記更新。')
doc.add_heading('完成或刪除項目', level=2)
para('使用者在清單勾選項目以更新完成狀態；點選刪除按鈕後，系統顯示包含項目名稱的確認提示，確認後移除項目並更新完成進度及月曆預覽。')
doc.add_heading('查看日期安排', level=2)
para('使用者切換月曆月份或點選日期；系統更新所選日期、今日清單與日期預覽。月曆格顯示至多三個項目標記，預覽顯示前三項，完整清單依時間排序。')

doc.add_heading('6 資料欄位與規則', level=1)
table(['資料','必要欄位','規則'],[
 ['行程','名稱、日期、時間、類型','單次項目；不支援重複設定。可設定頁面提醒。'],
 ['待辦任務','名稱、截止日期、時間、優先順序、完成狀態','單次項目；不支援重複設定。優先順序至少包含高、一般、低。'],
 ['習慣','名稱、每日完成狀態','以每日勾選記錄；支援取消勾選。習慣週目標與自訂頻率尚未確認。'],
 ['提醒','提醒設定、觸發時點、顯示狀態','本期以頁面內提示為主，不包含作業系統推播。提醒觸發策略待確認。'],
], [1.0,2.5,3.65], 8.5)

doc.add_heading('7 UI 與體驗原則', level=1)
bullets([
 '今日清單與月曆為主要工作區；畫面需清楚區分行程與待辦，避免僅以顏色傳達類型。',
 '月曆每日只放少量項目提示，完整內容透過日期選取後的清單檢視。',
 '新增表單欄位簡潔，優先讓使用者完成名稱、日期與時間等核心資訊。',
 '刪除操作使用易辨認的按鈕及確認提示，並支援鍵盤焦點與清楚的無障礙名稱。',
 '手機版採單欄內容與底部導覽；桌面版採側邊導覽與雙欄資訊配置。',
])

doc.add_heading('8 非功能需求', level=1)
table(['面向','需求'],[
 ['相容性','支援常見桌面與手機瀏覽器；介面在窄螢幕下保持可讀及可操作。'],
 ['可用性','勾選、日期切換、新增與刪除後應即時更新畫面並提供狀態回饋。'],
 ['無障礙','互動元件需有可讀標籤、鍵盤可操作狀態，顏色對比足以辨識。'],
 ['資料保存','正式版本的儲存方式、備份及跨裝置同步策略尚待產品／技術決策；目前原型重新載入會重置示範資料。'],
 ['隱私與安全','個人行程內容屬個人資料；正式版需定義身份驗證、存取控制、保存期限與刪除政策。'],
], [1.15,6.0])

doc.add_heading('9 驗收條件', level=1)
bullets([
 '桌面及手機版均可找到今日清單、月曆與習慣入口。',
 '在月曆選取日期後，今日清單、日期標題及當日預覽同步更新；預覽最多顯示三項。',
 '新增行程或待辦後，項目依日期出現在清單，並在月曆該日期出現標記。',
 '可勾選／取消勾選待辦，完成數與進度同步更新。',
 '點選項目刪除後先出現確認提示；取消時項目保留，確認時項目從清單及月曆預覽移除。',
 '每日習慣可勾選及取消，畫面狀態即時更新。',
 '頁面提醒可以關閉；表單可選擇項目提醒設定。',
])

doc.add_heading('10 假設與待確認事項', level=1)
table(['待確認','目前處理方式／建議'],[
 ['任務截止日期與時間的語意','原型將日期與時間作為清單排序依據；需確認是否需要獨立截止時間，或時間僅為提醒／排程時間。'],
 ['提醒觸發方式','先以頁面內提示呈現；需決定提示是在到達時間自動出現、開啟頁面時提示，或由使用者手動管理。'],
 ['資料保存與登入','原型使用記憶體示範資料；正式產品需決定本機保存、雲端帳號及同步策略。'],
 ['習慣週目標','目前是每日完成勾選；是否需要設定每週目標、歷史紀錄與補打卡待確認。'],
 ['項目分類與搜尋','目前沒有自訂分類、標籤及搜尋；是否納入後續版本待確認。'],
], [2.0,5.15], 8.5)

doc.add_heading('11 建議交付階段', level=1)
para('為便於先驗證核心使用流程，建議先交付不含帳號同步與外部通知的個人版，再依使用回饋安排擴充。此分期為產品建議，尚待確認。')
table(['階段','建議內容','完成重點'],[
 ['第一階段 核心版本','今日清單、月曆、行程與待辦新增／刪除、完成狀態、每日習慣、頁面內提醒。','使用者能從建立安排到完成追蹤，資料可可靠保存。'],
 ['第二階段 擴充能力','帳號與跨裝置同步、重複項目、進階提醒、習慣歷史與週目標、搜尋與分類。','根據第一階段使用數據與回饋，選擇最有價值的擴充功能。'],
], [1.4,3.4,2.25], 8.5)

# Footer with page number field
for section in doc.sections:
    footer=section.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
    run=footer.add_run('個人行程與任務管理系統  ·  PRD  |  '); run.font.name='Microsoft JhengHei'; run.font.size=Pt(8); run.font.color.rgb=RGBColor.from_string(GRAY); run._element.rPr.rFonts.set(qn('w:eastAsia'),'Microsoft JhengHei')
    fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'PAGE'); footer._p.append(fld)

doc.core_properties.title='個人行程與任務管理系統 產品需求規格書'
doc.core_properties.subject='個人行程、待辦、頁面提醒與習慣追蹤產品需求'
doc.core_properties.author=''
doc.save(OUT)
print(OUT)
