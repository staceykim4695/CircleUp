SELECT p.product_id, p.product_name, SUM(s.quantity * s.sale_price) AS cum_revenue
FROM sales s
JOIN products p on p.product_id = s.fk_product_id
GROUP BY p.product_id
ORDER BY cum_revenue DESC
LIMIT 3;
