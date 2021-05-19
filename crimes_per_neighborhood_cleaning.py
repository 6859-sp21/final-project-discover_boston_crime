from numpy.core.defchararray import count
from numpy.lib.function_base import append, percentile
import pandas as pd
import numpy as np
import copy

source_file_path = r"C:\Users\victo\Desktop\6.859\final-project-discover_boston_crime\crime_aggregated_code_groups.csv"
destination_file_path = r"C:\Users\victo\Desktop\6.859\final-project-discover_boston_crime\boston_crimes_per_neighborhood.csv"

#indexes chosen to signify 6/15/2015 - 7/15/2015 as denoted by map.js's selection
start_index = 0
end_index = 3619 

def get_count(crime_CSV):
    #[total, larceny, disorderly conduct]
    crime_count_map = {
        "Total Crimes": 0,
        "Drug Violation" : 0,
        "Larceny": 0,
        "Vandalism": 0,
        "Assault": 0,
        "Firearms and Explosives": 0, 
        "Burglary": 0,
        "Disorderly Conduct": 0,
        "Robbery": 0
    }

    neighborhood_to_count_map = {
        "Boston" : crime_count_map.copy(),
        "A1" : crime_count_map.copy(),
        "A7" : crime_count_map.copy(),
        "A15" : crime_count_map.copy(),
        "B2" : crime_count_map.copy(),
        "B3" : crime_count_map.copy(),
        "C6" : crime_count_map.copy(),
        "C11" : crime_count_map.copy(),
        "D4" : crime_count_map.copy(),
        "D14" : crime_count_map.copy(),
        "E5" : crime_count_map.copy(),
        "E13" : crime_count_map.copy(),
        "E18" : crime_count_map.copy()
    }


    for i in range(start_index, end_index):
        district = crime_CSV.iloc[i,crime_CSV.columns.get_loc("DISTRICT")]
        offense_code = crime_CSV.iloc[i,crime_CSV.columns.get_loc("Aggregated Offence Code Group")]

        if(district == np.nan or district == "" or pd.isnull(district)): continue

        try:
            neighborhood_to_count_map["Boston"][offense_code] += 1
            neighborhood_to_count_map[district][offense_code] += 1

        except:
            continue

        neighborhood_to_count_map["Boston"]["Total Crimes"] += 1
        neighborhood_to_count_map[district]["Total Crimes"] += 1

        

    return neighborhood_to_count_map

def format_csv(neighborhood_to_count_map):
    neighborhoods_col = ["Boston", "A1", "A7", "A15", "B2", "B3", "C6", "C11", "D4", "D14", "E5", "E13", "E18"]
    crimes_list = ["Drug Violation", "Larceny", "Vandalism", "Assault", "Firearms and Explosives", "Burglary", "Disorderly Conduct", "Robbery"]
    count_dict = dict()
    percent_dict = dict()

    total_crime_list = []
    for neighborhood in neighborhoods_col:
        total_crime_list.append(neighborhood_to_count_map[neighborhood]["Total Crimes"])

    dataframe_dict = {
        "Neighborhood" : neighborhoods_col,
        "Total Crimes" : total_crime_list,
    }

    for crime in crimes_list:
        count_list = []
        percent_list = []

        for neighborhood in neighborhoods_col:
            count = neighborhood_to_count_map[neighborhood][crime]
            total = neighborhood_to_count_map[neighborhood]["Total Crimes"]
            count_list.append(count)
            percent_list.append(count/total)

        
        dataframe_dict[crime] = count_list
        dataframe_dict[crime + " %"] = percent_list

    df = pd.DataFrame(dataframe_dict)
    print(df)
    df.to_csv(destination_file_path)

    
def calculate_percents(crime_CSV):
    crime_count_dict = dict()

    for i in range(start_index,end_index):
        offense_code = crime_CSV.iloc[i,crime_CSV.columns.get_loc("Aggregated Offence Code Group")]
        try:
            crime_count_dict[offense_code] += 1
        except:
            crime_count_dict[offense_code] = 1
    
    print(crime_count_dict)

    


if __name__ == "__main__":
    crime_CSV = pd.read_csv(source_file_path, engine='python')
    neighborhood_to_count_map = get_count(crime_CSV)
    #calculate_percents(crime_CSV)
    #print(neighborhood_to_count_map)
    format_csv(neighborhood_to_count_map)
