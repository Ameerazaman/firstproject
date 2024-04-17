console.log("hai")
function sendOTP(){
    const email=document.getElementById('email');
    const otpverify=document.getElementsByClassName('otpverfy')[0];
   let otp_val=Math.floor(Math.random() * 10000)
   let emailbody=`<h2>Your OTP is</h2>${otp_val}`;
    Email.send({
        SecureToken : "8afd627c-b537-4c21-a548-d10135267533",
        To : email.value,
        From : "fathimathameeraap@gmail.com",
        Subject : "Email OTP",
        Body : emailbody
    }).then(
      message => {
        if(message === "ok"){
            alert("otp sent to your email" + email.value);
            otpverify.style.disply="flex";
            const otp_inp=document.getElementById('otp_inp');
            const otp_btn=document.getElementById('otp_btn');
            otp_btn.addEventListener('click',()=>{
                if(otp_inp.value===otp_val){
                    alert("Email address verified...")
                }
                else{
                    alert('Invalid OTP')
                }
            })
        }
      }
    );
}




//                 const { email } = req.body;
            
//   // Check if the email is already registered
//   if (userStore[email]) {
//     return res.status(400).json({ error: 'Email already registered' });
//   }

//   // Generate OTP
//   const otp = generateOTP();
//   console.log(otp)
//   // Save the OTP in the user store
//   userStore[email] = { otp };

//   // Send the OTP via email
//   const transporter = nodemailer.createTransport({
//     service: 'gmail', // e.g., 'gmail'
//     auth: {
//       user: 'fathimathameeraap@gmail.com',
//       pass: emailConfig.pass,
//     },
//   });

//   const mailOptions = {
//     from: 'fathimathameeraap@gmail.com',
//     to: 'fathimathameeraap@gmail.com',
//     subject: 'OTP for Signup',
//     text: `Your OTP for signup: ${otp}`,
//   };

//   try {
//     transporter.sendMail(mailOptions);
//     console.log("otp sent successfully")
//     return res.res.render('users/verification',{email})
    
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Failed to send OTP' });
//   }
////////////////


