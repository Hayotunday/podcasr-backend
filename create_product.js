import dotenv from 'dotenv'
dotenv.config();
const stripe = require('stripe')('sk_test_51L88IfIeCkjlt8VX3WnVMyOn3U0wZrBbcEXsHPe5mPLhwF2Ovnuj9M5lxany0vLnb3B868o5cZAb7bl31WqlDoey00RhWNv641');

stripe.products.create({
  name: 'Starter Subscription',
  description: '$12/Month subscription',
}).then(product => {
  stripe.prices.create({
    unit_amount: 1200,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    product: product.id,
  }).then(price => {
    console.log('Success! Here is your starter subscription product id: ' + product.id);
    console.log('Success! Here is your starter subscription price id: ' + price.id);
  });
});