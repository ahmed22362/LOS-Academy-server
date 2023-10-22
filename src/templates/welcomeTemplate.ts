const greetingTemplate = function (name: string) {
  const html = `<!DOCTYPE html>
    <html>
    
    <head>
      <title>Greetings ${name}!</title>
      
      <!-- Use Google Fonts -->
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
      
      <style>
        body {
          font-family: 'Poppins', sans-serif;
          background-color: #f2f4f5;
        }
        
        .container {
          background-color: #fff;
          width: 500px;
          margin: 50px auto;
          border-radius: 10px;
          overflow: hidden; 
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
          background-color: #1a73e8;
          padding: 20px; 
          text-align: center; 
          color: #fff;
        }
        
        h1 {
          margin: 0;
        }
        
        .content {
          padding: 30px 20px;
          text-align: center; 
        }
        
        img {
          width: 150px;
          border-radius: 50%;
          margin-bottom: 20px;
        }
      </style>
    </head>
    
    <body>
    
      <div class="container">
    
        <div class="header">
          <h1>Hello ${name} !</h1>
        </div>
    
        <div class="content">          
          <p>We are excited to have you as a new user. Welcome to our app!</p>
    
          <p>Please let us know if you have any questions. We are happy to help!</p>
    
          <p>Best regards,</p>
          <p>The Team</p>
        </div>
    
      </div>
    
    </body>
    </html>`
  const text: string = `Welcome`
  return { html, text }
}
export default greetingTemplate
