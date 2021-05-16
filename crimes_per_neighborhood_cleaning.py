from numpy.core.defchararray import count
import pandas as pd
import numpy as np

source_file_path = r"C:\Users\victo\Desktop\6.859\final-project-discover_boston_crime\crime_aggregated_code_groups.csv"
destination_file_path = r"C:\Users\victo\Desktop\6.859\final-project-discover_boston_crime\boston_crimes_per_neighborhood.csv"

#indexes chosen to signify 6/15/2015 - 7/15/2015 as denoted by map.js's selection
start_index = 0
end_index = 4165 

def get_count(crime_CSV):
    #[total, larceny, disorderly conduct]
    neighborhood_to_count_map = {
        "Boston" : [0,0,0],
        "A1" : [0,0,0],
        "A7" : [0,0,0],
        "A15" : [0,0,0],
        "B2" : [0,0,0],
        "B3" : [0,0,0],
        "C6" : [0,0,0],
        "C11" : [0,0,0],
        "D4" : [0,0,0],
        "D14" : [0,0,0],
        "E5" : [0,0,0],
        "E13" : [0,0,0],
        "E18" : [0,0,0]
    }

    for i in range(start_index, end_index):
        district = crime_CSV.iloc[i,crime_CSV.columns.get_loc("DISTRICT")]
        offense_code = crime_CSV.iloc[i,crime_CSV.columns.get_loc("Aggregated Offence Code Group")]

        if(district == np.nan or district == "" or pd.isnull(district)): continue

        neighborhood_to_count_map["Boston"][0] += 1
        neighborhood_to_count_map[district][0] += 1

        if(offense_code == "Larceny"):
            neighborhood_to_count_map["Boston"][1] += 1
            neighborhood_to_count_map[district][1] += 1
        
        if(offense_code == "Disorderly Conduct"):
            neighborhood_to_count_map["Boston"][2] += 1
            neighborhood_to_count_map[district][2] += 1

    return neighborhood_to_count_map

def format_csv(neighborhood_to_count_map):
    neighborhoods_col = ["Boston", "A1", "A7", "A15", "B2", "B3", "C6", "C11", "D4", "D14", "E5", "E13", "E18"]
    total_crime_col = []
    larceny_count_col = []
    larceny_percent_col = []
    disorderly_count_col = []
    disorderly_percent_col = []

    for neighborhood in neighborhoods_col:
        count_list = neighborhood_to_count_map[neighborhood]
        total_crime_col.append(count_list[0])
        larceny_count_col.append(count_list[1])
        larceny_percent_col.append(count_list[1]/count_list[0])
        disorderly_count_col.append(count_list[2])
        disorderly_percent_col.append(count_list[2]/count_list[0])
    
    dataframe_dict = {
        "Neighborhood" : neighborhoods_col,
        "Total Crimes" : total_crime_col,
        "Larceny" : larceny_count_col,
        "Larceny %" : larceny_percent_col,
        "Disorderly Conduct" : disorderly_count_col,
        "Disorderly Conduct %" : disorderly_percent_col
    }
    df = pd.DataFrame(dataframe_dict)
    
    df.to_csv(destination_file_path)

    





if __name__ == "__main__":
    crime_CSV = pd.read_csv(source_file_path, engine='python')
    neighborhood_to_count_map = get_count(crime_CSV)
    format_csv(neighborhood_to_count_map)
