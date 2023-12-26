import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'LOS Academy API',
    description: 'Description'
  },
  host: 'localhost:3000'
};
const outputFile = '../../swagger-output.json';
const routes = ["../router/user.router"
,"../router/teacher.router"
,"../router/plan.router"
,"../router/session.router"
,"../router/course.router"
,"../router/subscription.router"
,"../router/stripe.router"
,"../router/report.router"
,"../router/payout.router"
,"../router/material.router"
,"../router/monthlyReports.router"
,"../router/feedback.router"];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen()(outputFile, routes, doc);  