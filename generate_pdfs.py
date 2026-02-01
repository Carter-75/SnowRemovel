"""
Generate legal PDFs for SnowRemovel
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os

# Get the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(script_dir, 'public', 'legal')
os.makedirs(public_dir, exist_ok=True)

# Define paths
terms_pdf_path = os.path.join(public_dir, 'terms.pdf')
cancel_pdf_path = os.path.join(public_dir, 'right-to-cancel.pdf')

# Create styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=18,
    textColor='#000000',
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)
heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=14,
    textColor='#000000',
    spaceAfter=10,
    spaceBefore=10,
    fontName='Helvetica-Bold'
)
body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=11,
    textColor='#333333',
    spaceAfter=10,
    alignment=TA_JUSTIFY,
    fontName='Helvetica'
)

def generate_terms_pdf():
    """Generate Terms & Conditions PDF"""
    doc = SimpleDocTemplate(terms_pdf_path, pagesize=letter,
                           rightMargin=0.75*inch, leftMargin=0.75*inch,
                           topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    story = []
    
    # Title
    story.append(Paragraph("Terms & Conditions", title_style))
    story.append(Paragraph("Carter Moyer Snow Removal", heading_style))
    story.append(Paragraph("Last updated: January 31, 2026", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Property Access Consent
    story.append(Paragraph("Property Access Consent", heading_style))
    story.append(Paragraph(
        "By purchasing this service, you explicitly grant Carter Moyer Snow Removal permission to enter "
        "your property at the address provided to perform snow removal services. You represent and warrant "
        "that you have full authority to grant such permission and that you will ensure reasonable access "
        "to the property is available at the scheduled service time.",
        body_style
    ))
    story.append(Paragraph(
        "If you are not the property owner, you confirm that you have obtained permission from the property "
        "owner to authorize snow removal services and property access.",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Liability Waiver
    story.append(Paragraph("Liability Waiver & Insurance Disclosure", heading_style))
    story.append(Paragraph(
        "<b>Insurance Status:</b> Carter Moyer Snow Removal currently operates without commercial "
        "general liability insurance or professional liability coverage. By booking this service, you "
        "acknowledge this disclosure.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Assumption of Risk:</b> Customer acknowledges and accepts that snow removal involves "
        "inherent risks including but not limited to: damage from hidden obstacles under snow cover, damage "
        "to landscaping or property features not visible due to snow accumulation, damage to underground "
        "utilities or irrigation systems, and property damage from snow placement.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Limitation of Liability:</b> Provider's liability for any property damage is limited "
        "to the amount paid for the service. Provider is not liable for pre-existing damage, damage from "
        "hidden obstacles, or damage resulting from conditions beyond the provider's reasonable control.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Customer Responsibilities:</b> Customer is responsible for marking or disclosing any "
        "hidden obstacles, decorations, irrigation systems, or sensitive areas before service. Failure to "
        "disclose such hazards releases Provider from liability for related damage.",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Indemnification
    story.append(Paragraph("Indemnification", heading_style))
    story.append(Paragraph(
        "Customer agrees to indemnify, defend, and hold harmless Carter Moyer Snow Removal from any and all "
        "claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) "
        "arising from or related to: (a) injuries to persons or damage to property occurring on customer's "
        "premises during or as a result of the service, except where caused by Provider's gross negligence "
        "or willful misconduct; (b) any breach of customer's representations regarding authority to grant "
        "property access; (c) customer's failure to disclose known hazards or obstacles.",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Payment & Drive Fee Policy
    story.append(Paragraph("Payment & Drive Fee Policy", heading_style))
    story.append(Paragraph(
        "No travel fee applies when one-way travel time is 15 minutes or less. When one-way travel time "
        "exceeds 15 minutes, the travel fee is the higher of: (a) round-trip time × $15/hour, or "
        "(b) one-way miles × $1.50 per mile.",
        body_style
    ))
    story.append(Paragraph(
        "Payment is required before dispatch. Service will not begin and no travel will occur until payment "
        "has been received.",
        body_style
    ))
    story.append(Paragraph(
        "Snow placement: Snow will be moved onto the customer's yard or designated area. Snow is not pushed "
        "into public roadways.",
        body_style
    ))
    story.append(Paragraph(
        "Standard scheduling requires at least 3 business days notice. Requests inside this window are treated "
        "as urgent and may require an emergency waiver for immediate service.",
        body_style
    ))
    story.append(Paragraph(
        "Urgency upcharge: A 10% convenience upcharge applies to all services requested to be completed "
        "within 3 business days of the request date.",
        body_style
    ))
    story.append(Paragraph(
        "Emergency service waiver: By requesting service for an immediate emergency need (e.g., clearing "
        "property to prevent city fines or for safety/egress), you expressly waive your three-day right "
        "to cancel this transaction to allow for immediate performance of the work.",
        body_style
    ))
    story.append(Paragraph(
        "Access policy: If we arrive and are unable to access the property after reasonable attempts to "
        "contact you by text, phone, and email, and the one-way travel time exceeds 30 minutes, the "
        "service will be treated as completed and payment is non-refundable.",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Customer's Right to Cancel
    story.append(Paragraph("CUSTOMER'S RIGHT TO CANCEL", heading_style))
    story.append(Paragraph(
        "YOU MAY CANCEL THIS AGREEMENT BY MAILING A WRITTEN NOTICE TO CARTER MOYER SNOW REMOVAL, 401 "
        "GILLETTE ST, LA CROSSE, WI 54603 BEFORE MIDNIGHT OF THE THIRD BUSINESS DAY AFTER YOU SIGNED THIS "
        "AGREEMENT. IF YOU WISH, YOU MAY USE THIS PAGE AS THAT NOTICE BY WRITING \"I HEREBY CANCEL\" AND "
        "ADDING YOUR NAME AND ADDRESS. A DUPLICATE OF THIS PAGE IS PROVIDED BY THE SELLER FOR YOUR RECORDS.",
        body_style
    ))
    story.append(Paragraph(
        "Cancellation requests may also be sent by email or text as a written notice. The statutory notice "
        "above is provided verbatim and remains the controlling language. Email or text cancellations must be "
        "received before the scheduled service day. Email: cartermoyer75@gmail.com. Text: 920-904-2695.",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Provider Right to Cancel
    story.append(Paragraph("Provider Right to Cancel", heading_style))
    story.append(Paragraph(
        "Carter Moyer Snow Removal reserves the right to cancel or decline any request at any time prior "
        "to performing the work. If the request is cancelled by the provider before work begins, you will "
        "receive a full refund.",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Electronic Records
    story.append(Paragraph("Electronic Records & Signatures", heading_style))
    story.append(Paragraph(
        "By submitting a request and checking the agreement box, you consent to do business electronically "
        "and acknowledge that your electronic signature is legally binding.",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Record Retention
    story.append(Paragraph("Record Retention", heading_style))
    story.append(Paragraph(
        "Records related to your request and service may be retained for up to three years.",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    # Copyright
    story.append(Paragraph("Copyright", heading_style))
    story.append(Paragraph(
        "© 2026 Carter Moyer Snow Removal. All rights reserved. Content and materials "
        "on this site may not be copied, reproduced, or distributed without written permission.",
        body_style
    ))
    
    doc.build(story)
    print(f"✓ Generated: {terms_pdf_path}")


def generate_right_to_cancel_pdf():
    """Generate Right to Cancel PDF"""
    doc = SimpleDocTemplate(cancel_pdf_path, pagesize=letter,
                           rightMargin=0.75*inch, leftMargin=0.75*inch,
                           topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    story = []
    
    # Title
    story.append(Paragraph("NOTICE OF RIGHT TO CANCEL", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    # Main notice
    story.append(Paragraph(
        "YOU MAY CANCEL THIS AGREEMENT BY MAILING A WRITTEN NOTICE TO THE SELLER. THE NOTICE MUST SAY "
        "THAT YOU DO NOT WISH TO BE BOUND BY THE AGREEMENT AND MUST BE MAILED BEFORE MIDNIGHT OF THE "
        "THIRD BUSINESS DAY AFTER YOU SIGNED THIS AGREEMENT.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "The notice must be mailed to:",
        body_style
    ))
    story.append(Spacer(1, 0.1*inch))
    
    story.append(Paragraph(
        "<b>Carter Moyer Snow Removal</b><br/>"
        "401 Gillette St<br/>"
        "La Crosse, WI 54603",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "IF YOU WISH TO CANCEL, YOU MAY USE THE FORM BELOW. KEEP ONE COPY FOR YOUR RECORDS AND MAIL "
        "THE OTHER TO THE ADDRESS SHOWN ABOVE.",
        body_style
    ))
    story.append(Spacer(1, 0.3*inch))
    
    # Cancellation form
    story.append(Paragraph("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("<b>CANCELLATION FORM</b>", heading_style))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "Date: _________________________________",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph(
        "I hereby cancel the snow removal service agreement entered into on _________________ (date).",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "Name: _________________________________",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph(
        "Address: _________________________________",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph(
        "_________________________________",
        body_style
    ))
    story.append(Spacer(1, 0.15*inch))
    
    story.append(Paragraph(
        "_________________________________",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "Signature: _________________________________",
        body_style
    ))
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -", body_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Alternative cancellation methods
    story.append(Paragraph("<b>Alternative Cancellation Methods:</b>", heading_style))
    story.append(Paragraph(
        "Cancellation requests may also be sent by email to <b>cartermoyer75@gmail.com</b> or by text to "
        "<b>920-904-2695</b>. The cancellation must be received before the scheduled service day.",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph(
        "<b>Important:</b> This notice of cancellation must be received before midnight of the third business day "
        "after the date you signed the agreement. If you requested emergency service, you may have waived this "
        "cancellation right to allow immediate work.",
        body_style
    ))
    
    doc.build(story)
    print(f"✓ Generated: {cancel_pdf_path}")


if __name__ == "__main__":
    print("Generating legal PDFs...")
    generate_terms_pdf()
    generate_right_to_cancel_pdf()
    print("\n✓ All PDFs generated successfully!")
