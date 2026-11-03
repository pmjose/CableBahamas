CREATE TABLE CABLEBAHAMAS_DEMO.ANALYTICS.PRODUCTS AS
SELECT column1::VARCHAR AS PRODUCT_ID, column2::VARCHAR AS PRODUCT_NAME,
       column3::VARCHAR AS SERVICE_FAMILY, column4::NUMBER(10,2) AS MONTHLY_PRICE_BSD,
       column5::NUMBER AS DOWNLOAD_MBPS, column6::NUMBER(10,2) AS MONTHLY_COST_BSD,
       column7::VARCHAR AS CUSTOMER_SEGMENT,
       'Synthetic offer, not an actual commercial tariff'::VARCHAR AS DATA_NOTE
FROM VALUES
('P01','REVNET Starter 100','Broadband',55,100,22,'Consumer'),
('P02','REVNET Plus 300','Broadband',75,300,28,'Consumer'),
('P03','REVNET Gigabit','Broadband',110,1000,39,'Consumer'),
('P04','REVTV Essential','TV',35,0,18,'Consumer'),
('P05','REVTALK Home','Fixed Voice',15,0,4,'Consumer'),
('P06','REVHome Internet and TV','Fixed Bundle',95,300,43,'Consumer'),
('P07','Business Fibre 500','Business Connectivity',250,500,95,'Business'),
('P08','Business Dedicated Gigabit','Business Connectivity',650,1000,260,'Business');
