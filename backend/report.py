from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from database import get_cursor
from datetime import datetime

def generate_pdf(filename="report.pdf", period="all"):
    doc = SimpleDocTemplate(filename)
    styles = getSampleStyleSheet()

    c = get_cursor()
    query = "SELECT * FROM violations"
    
    if period == "daily":
        today_start = datetime.now().strftime('%Y-%m-%dT00:00:00')
        query += f" WHERE timestamp >= '{today_start}'"
    elif period == "monthly":
        month_start = datetime.now().replace(day=1).strftime('%Y-%m-%dT00:00:00')
        query += f" WHERE timestamp >= '{month_start}'"
    elif period == "yearly":
        year_start = datetime.now().replace(month=1, day=1).strftime('%Y-%m-%dT00:00:00')
        query += f" WHERE timestamp >= '{year_start}'"

    query += " ORDER BY id DESC"
    c.execute(query)
    data = c.fetchall()

    content = [Paragraph(f"VisionShield Violation Report (Period: {period.upper()})", styles["Heading1"])]
    if not data:
        content.append(Paragraph("No violations recorded for this period.", styles["Normal"]))
    else:
        for row in data:
            content.append(Paragraph(str(row), styles["Normal"]))

    doc.build(content)
    return filename
