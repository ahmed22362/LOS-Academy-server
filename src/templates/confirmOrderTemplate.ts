const generateConfirmOrder = function (
  order: any,
  totalPrice: number,
  name: string
) {
  let itemsHtml = ""
  if (order.items) {
    for (let item of order.items) {
      itemsHtml += `
              <tr>
                <td>${item.product.title}</td>
                <td>${item.quantity}</td>
                <td>${item.product.price}</td>
              </tr>
            `
    }
  } else {
    itemsHtml += `
    <tr>
    <td>${order.files[0].fileName}</td>
    <td>${order.quantity}</td>
    <td>${order.totalCost}</td>
    </tr>
    `
  }

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>Order Confirmation</title>
  
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 16px;  
      }
      
      h1, h2 {
        text-align: center;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
      }
      
      th, td {
        padding: 8px;
        text-align: left;
        border: 1px solid #ddd;
      }
      
      th {
        background-color: #f2f2f2;
      }
    </style>
  
  </head>
  
  <body>
  
    <div>
      <h1 style="color: #0066cc;">Thank You For Your Order!</h1>
    </div>
  
    <p>Hi ${name},</p>
  
    <p style="line-height: 1.5;">Your order #${order.paymobOrderId} has been received. Your order details are below. Please contact us if you have any questions!</p>
  
    <h2 style="border-bottom: 1px solid #0066cc; padding-bottom: 8px;">Order Summary</h2>
  
    <table>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Price</th> 
      </tr>
      <tbody>
        ${itemsHtml} 
      </tbody>
      <tr>
        <th>Total</th>
        <th>${totalPrice}</th> 
      </tr>
    </table>
  
    <p style="line-height: 1.5;">Your order will begin processing soon and will be shipped to:</p>
<!--
    // <p style="line-height: 1.5;">
    //   {shippingAddress}
    // </p>
  -->
    <p style="line-height: 1.5;">Please contact us at <a href="mailto:support@los_academy.info">support@los_academy.info</a> if you have any questions or concerns.</p>
  
    <p style="line-height: 1.5;">Thank you for shopping with us!</p>
  
    <p style="line-height: 1.5;">The LOS Academy Team</p>
  
  </body>
  </html>`
  return {
    html: html,
    text: "text",
  }
}
export default generateConfirmOrder
