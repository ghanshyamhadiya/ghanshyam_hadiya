from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("ReadLargeCSV") \
    .getOrCreate()

csv_path = r"D:\New folder\git\poc\PW_FACT_ENERGY_FLOW.csv"

df = spark.read \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .csv(csv_path)

df.show(10)
df.printSchema()