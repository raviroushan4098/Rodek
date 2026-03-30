import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../_lib/firebase.js';
import { verifyAuth, sendError, sendSuccess } from '../_lib/auth.js';

export default async function handler(req, res) {
    const user = await verifyAuth(req);
    if (!user) return sendError(res, 401, 'Unauthorized');

    if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

    const { bookingData } = req.body;
    if (!bookingData) return sendError(res, 400, 'Booking data is required');

    try {
        // Fetch car and customer names for the email (early validation)
        const carDoc = await db.collection('cars').doc(bookingData.carId).get();
        const customerDoc = await db.collection('customers').doc(bookingData.customerId).get();

        if (!carDoc.exists || !customerDoc.exists) {
            return sendError(res, 404, 'Car or Customer not found');
        }

        const car = carDoc.data();
        const customer = customerDoc.data();

        // Generate signature token and store the "Invite"
        const signatureToken = uuidv4();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        
        await db.collection('signature_invites').doc(signatureToken).set({
            bookingData,
            customerId: bookingData.customerId,
            carId: bookingData.carId,
            userId: user.uid,
            createdAt: new Date(),
            expiresAt
        });

        // Setup Nodemailer
        const port = parseInt(process.env.SMTP_PORT || '587');

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
        });

        const baseUrl = process.env.SITE_URL 
            || 'https://rodek.vercel.app';

        const signatureLink = `${baseUrl}/agreement/${signatureToken}`;

        const agreementHtml = `
            <div style="font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                
                <!-- ═══════ PREMIUM HEADER ═══════ -->
                <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 40px 35px 35px; text-align: center;">
                    <div style="display: inline-block; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 10px 28px; margin-bottom: 18px;">
                        <span style="color: #e8b04a; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700;">Official Document</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">0-MILE TOUR AND TRAVEL</h1>
                    <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px; letter-spacing: 0.5px;">PRIVATE LIMITED</p>
                    <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #e8b04a, #f0c674); margin: 18px auto 0; border-radius: 2px;"></div>
                    <h2 style="color: #e8b04a; margin: 18px 0 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Self Drive Car Rental Agreement</h2>
                </div>

                <div style="padding: 35px 35px 40px;">
                    
                    <!-- ═══════ EXPIRY WARNING ═══════ -->
                    <div style="background: linear-gradient(135deg, #fff5f5, #ffe8e8); border: 1px solid #fecaca; border-radius: 10px; padding: 14px 20px; margin-bottom: 28px; text-align: center;">
                        <span style="color: #dc2626; font-weight: 800; font-size: 14px; letter-spacing: 0.5px;">⏰ SECURE LINK — EXPIRES IN 10 MINUTES</span>
                    </div>

                    <!-- ═══════ BOOKING DETAILS CARD ═══════ -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; font-weight: 700; margin-bottom: 16px;">Reservation Details</div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; width: 100px;">Customer</td>
                                <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${customer.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Vehicle</td>
                                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-top: 1px solid #f1f5f9;">${car.make} ${car.model} <span style="color: #64748b; font-weight: 400;">(${car.plateNumber})</span></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Period</td>
                                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-top: 1px solid #f1f5f9;">${new Date(bookingData.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — ${new Date(bookingData.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- ═══════ TERMS & CONDITIONS ═══════ -->
                    <div style="margin-bottom: 28px;">
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #0f3460; font-weight: 800; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">Terms & Conditions</div>
                        <div style="font-size: 13.5px; color: #334155; line-height: 1.8;">
                            <p style="margin: 0 0 10px; padding-left: 16px; border-left: 3px solid #cbd5e1;">__0-mile tour and travel private limited members have answered any question I have had.</p>
                            <p style="margin: 0 0 10px; padding-left: 16px; border-left: 3px solid #cbd5e1;">__I have carefully read this agreement in its entirety and understood the contents.</p>
                            <p style="margin: 0 0 10px; padding-left: 16px; border-left: 3px solid #e8b04a;">● I am aware that this is an assumption of risk, waiver and release of liability and sign it voluntarily.</p>
                            <p style="margin: 0 0 10px; padding-left: 16px; border-left: 3px solid #e8b04a;">● I also understand that I should not and may not participate in this activity if I am under the influence of alcohol or drugs.</p>
                            <p style="margin: 0 0 10px; padding-left: 16px; border-left: 3px solid #e8b04a;">● If I am carrying any kind of drugs. It is only my responsibility. 0-mile tour and travel private limited have no concern in this matter.</p>
                            <p style="margin: 0 0 10px; padding-left: 16px; border-left: 3px solid #dc2626;">● If I am involved in any illegal activity while using the car then I am only responsible for it, 0-mile tour and travel private limited l has the right to take back their vehicle.</p>
                        </div>
                    </div>

                    <!-- ═══════ SOLEMN DECLARATION ═══════ -->
                    <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #f59e0b; border-radius: 10px; padding: 24px; margin-bottom: 32px; text-align: center;">
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #92400e; font-weight: 800; margin-bottom: 12px;">⚖️ Solemn Declaration</div>
                        <p style="margin: 0; font-size: 14px; font-weight: 800; color: #78350f; line-height: 1.6; text-transform: uppercase;">I SOLEMNLY DECLARE THAT I HAVE THOROUGHLY READ THE TERMS AND CONDITION OF 0-mile tour and travel private limited AGREEMENT AND AGREE TO THEM.</p>
                        <p style="margin: 14px 0 0; font-size: 13.5px; color: #92400e; font-weight: 700;">___i assure you that i will not cross speed limit of 80 km/hr</p>
                    </div>

                    <!-- ═══════ ASSUMPTION OF RISK SECTION ═══════ -->
                    <div style="margin-bottom: 28px;">
                        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
                            <h3 style="margin: 0; color: #0f3460; font-size: 15px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">0-MILE TOUR AND TRAVEL PRIVATE LIMITED</h3>
                            <p style="margin: 4px 0 0; color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Assumption of Risk, Waiver and Release Agreement</p>
                        </div>
                        
                        <div style="font-size: 13px; color: #475569; line-height: 1.8;">
                            <div style="background: #f8fafc; border-left: 4px solid #0f3460; padding: 18px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
                                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #0f3460; font-weight: 800; margin-bottom: 10px;">Assumption of Risk</p>
                                <p style="margin: 0; color: #334155;">I understand and accept that renting this Car and participating in Car Driving exposes me to many hazards and entail unavoidable risk of death, personal injury (including but not limited to severe spinal or head injury) and loss of or damage to Property. I also understand I should be in good physical health to participate in Self drive car. I choose to participate in Self drive car in spite of these risks and hereby assume all risk of injury or loss of life to myself and loss of or damage to property arising out of renting this Self drive car. I understand the inherent risk involved in using this equipment, and accept full responsibility for any and all such damage or injury which may result.</p>
                            </div>
                            
                            <div style="background: #f8fafc; border-left: 4px solid #dc2626; padding: 18px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #dc2626; font-weight: 800; margin-bottom: 10px;">Waiver And Release</p>
                                <p style="margin: 0; color: #334155;">In consideration of 0-MILE renting me this Self drive car, I specifically release and forever discharge 0-MILE TOUR AND TRAVEL PRIVATE LIMITED and its affiliates, officers, agents, and employees from any and all liability or claims for injury, illness, death, loss or damage to property which I may suffer while renting this Self drive car. This discharge specifically includes, but is not limited to, liability or claims for injury, illness, death or damage caused by the negligence of 0-MILE or its affiliates, officers, agents, or employees. It is my intent by the Waiver And Release Agreement to release 0-MILE and hold it. Harmless from all liability for any such property loss or damage, personal injury or loss of life, whether caused by the negligence of 0-MILE or whether based upon breach of contract, breach of warranty, or any other legal theory. In signing this document, I fully recognize that if injury, illness, death or damage occurs to me while I am engaged in renting this Self drive car or participating in driving the car, I will have no right to make a claim or file a lawsuit against 0-MILE TOUR AND TRAVEL PRIVATE LIMITED or its affiliates, officers, agents or employees, even if they or any of them negligently cause my injury, illness, death or damage.</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- ═══════ SAFETY ACKNOWLEDGEMENTS ═══════ -->
                    <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; margin-bottom: 32px; font-size: 13px; color: #475569; line-height: 1.8;">
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 700; margin-bottom: 12px;">🛡️ Safety Acknowledgements</div>
                        <p style="margin: 0 0 8px; padding-left: 14px; border-left: 3px solid #94a3b8;">__I realise the importance of SeatBelt. A Seat Belt has been recommended to me by 0-MILE TOUR AND TRAVEL PRIVATE LIMITED staff. If I do not use a Seat Belt l am doing so at my own will.</p>
                        <p style="margin: 0 0 8px; padding-left: 14px; border-left: 3px solid #94a3b8;">__I understand that this activity may result in severe injury, including but not limited to spinal or head injury.</p>
                        <p style="margin: 0 0 8px; padding-left: 14px; border-left: 3px solid #94a3b8;">__I understand that this activity may result in hazards posed by other Car and traffic or road conditions.</p>
                        <p style="margin: 0; padding-left: 14px; border-left: 3px solid #e8b04a; font-weight: 700; color: #334155;">__if you want to extend car & Bike inform 1 day before*</p>
                    </div>

                    <!-- ═══════ CTA BUTTON ═══════ -->
                    <div style="text-align: center; padding: 10px 0 20px;">
                        <a href="${signatureLink}" style="display: inline-block; background: linear-gradient(135deg, #0f3460, #1a1a2e); color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 16px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(15,52,96,0.4);">✍️ VIEW & SIGN AGREEMENT</a>
                        <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">By clicking above, you will be redirected to a secure digital signature page</p>
                    </div>

                    <!-- ═══════ FOOTER ═══════ -->
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 10px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                        <p style="margin: 0;">This is an automated message from <strong style="color: #64748b;">0-MILE TOUR AND TRAVEL PVT. LTD.</strong></p>
                        <p style="margin: 4px 0 0;">If you did not request this booking, please ignore this email.</p>
                    </div>
                </div>
            </div>
        `;

        console.log(`[Agreement API] Attempting sendMail...`);
        const info = await transporter.sendMail({
            from: `"0-MILE Rental" <${process.env.SMTP_USER}>`,
            to: customer.email,
            subject: `Rental Agreement invitation for your ${car.make} ${car.model}`,
            html: agreementHtml,
        });

        console.log(`[Agreement API] Invite sent! Token: ${signatureToken}`);
        return sendSuccess(res, { message: 'Agreement invitation sent successfully', signatureToken });
    } catch (error) {
        console.error('[Agreement API] Error:', error);
        return sendError(res, 500, error.message || 'Failed to send invitation');
    }
}
