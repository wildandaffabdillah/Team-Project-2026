from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from database import get_cursor

def generate_pdf(filename="report.pdf"):
    doc = SimpleDocTemplate(filename)
    styles = getSampleStyleSheet()

    c = get_cursor()
    c.execute("SELECT * FROM violations")
    data = c.fetchall()

    content = []

    for row in data:
        content.append(Paragraph(str(row), styles["Normal"]))

    doc.build(content)

    return filename
