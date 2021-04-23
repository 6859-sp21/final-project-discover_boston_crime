import pandas as pd 

neighborhoodDataPath = r"C:\Users\victo\Desktop\6.859\final-project-discover_boston_crime\neighborhood_data_appended_horizontally.csv"


def aggregateNeighborhoodsToPoliceDistricts():
    originalDF = pd.read_csv(neighborhoodDataPath)

    districtToNeighborhoodMap = {
        "A1" : {"North End", "West End", "Downtown", "Beacon Hill"},
        "A7" : {"East Boston"},
        "A15" : {"Charlestown"},
        "B2" : {"Mission Hill", "Roxbury", "Longwood"},
        "B3" : {"Mattapan"},
        "C6" : {"South Boston", "South Boston Waterfront"},
        "C11" : {"Dorchester"}, 
        "D4" : {"Fenway", "Back Bay", "South End"},
        "D14" : {"Allston", "Brighton"},
        "E5" : {"West Roxbury", "Roslindale"},
        "E13" : {"Jamaica Plain"},
        "E18" : {"Hyde Park"}
    }

    neighborhoodLookUpDict = {}

    for district in districtToNeighborhoodMap.keys():
        for neighborhood in districtToNeighborhoodMap[district]:
            neighborhoodLookUpDict[neighborhood] = district
    


if __name__ == "__main__":
    exit()
    