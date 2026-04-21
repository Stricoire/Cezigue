import PyPDF2
import sys

def extract_text_from_pdf(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n--- PAGE BREAK ---\n"
            with open("pdf_output.txt", "w", encoding="utf-8") as f:
                f.write(text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_text_from_pdf("D:\\Antigravity\\Cezigue\\Antchouski\\Inputs\\Sales material\\Cezigue mobility Portfolio - FR.pdf")
