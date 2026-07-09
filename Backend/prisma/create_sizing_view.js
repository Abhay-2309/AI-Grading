import prisma from '../db.js';

async function main() {
  console.log('Creating SQL View verified_sizing_profiles...');
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE VIEW verified_sizing_profiles AS
    SELECT 
        o.product_id,
        cp.foot_length_cm,
        cp.foot_width,
        o.variant_id AS kept_variant_id,
        pv.size_numeric
    FROM orders o
    JOIN customer_profile cp ON o.customer_id = cp.customer_id
    JOIN product_variants pv ON o.variant_id = pv.variant_id
    LEFT JOIN ecommerce_returns r ON o.order_id = r.order_id 
        AND r.return_reason IN ('wrong_size','too_small','too_big','narrow_fit','wide_fit')
    WHERE r.return_id IS NULL;
  `);
  console.log('SQL View created successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
