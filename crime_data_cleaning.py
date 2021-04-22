from numpy.core.fromnumeric import size
import pandas as pd
import numpy as np

crimeCSVPath = r"C:\Users\victo\Desktop\6.859\final-project-discover_boston_crime\crime.csv"



def showDistribution(df):
    offenseDescriptionFrequencyDict = {}
    UCRParttoOffenseMap = {"Part One": set(), "Part Two": set(), "Part Three": set(), "None": set()}
    UCRFrequencyDict = {"Part One": 0, "Part Two": 0, "Part Three": 0, "None": 0}
    offenseCodeGrouptoDescriptionMap = {}

    for i in range(df.shape[0]):
        UCRPart = df.iloc[i,df.columns.get_loc("UCR_PART")]
        offenseDescription = df.iloc[i,df.columns.get_loc("OFFENSE_DESCRIPTION")]
        offenseGroup = df.iloc[i,df.columns.get_loc("OFFENSE_CODE_GROUP")]

        if(offenseDescription in offenseDescriptionFrequencyDict.keys()):
            offenseDescriptionFrequencyDict[offenseDescription] += 1
        else:
            offenseDescriptionFrequencyDict[offenseDescription] = 1
        
        if(offenseGroup in offenseCodeGrouptoDescriptionMap.keys()):
            if(len(offenseDescription) > 1): offenseCodeGrouptoDescriptionMap[offenseGroup].add(offenseDescription)
        else:
            offenseCodeGrouptoDescriptionMap[offenseGroup] = set()
            offenseCodeGrouptoDescriptionMap[offenseGroup].add(offenseDescription)
        
        try:
            UCRFrequencyDict[UCRPart] += 1
            UCRParttoOffenseMap[UCRPart].add(offenseDescription)
        except:
            UCRFrequencyDict["None"] += 1
            UCRParttoOffenseMap["None"].add(offenseDescription)
    

    for offenseDescription in sorted(offenseDescriptionFrequencyDict.keys(), key = lambda x: offenseDescriptionFrequencyDict[x]):
        print(offenseDescription + " : " + str(offenseDescriptionFrequencyDict[offenseDescription]))
    print('____________________________')
    print(len(offenseCodeGrouptoDescriptionMap.keys()))
    for codeGroup in offenseCodeGrouptoDescriptionMap:
        print("Code Group: " + codeGroup)
        print(offenseCodeGrouptoDescriptionMap[codeGroup])
    print('_____________________________')
    for UCRPart in UCRParttoOffenseMap:
        print(UCRPart + " frequency: " + str(UCRFrequencyDict[UCRPart]))
        print("Mapped offenses: " + str(UCRParttoOffenseMap[UCRPart]))




if __name__ == "__main__":
    crimeCSV = pd.read_csv(crimeCSVPath, engine='python')
    showDistribution(crimeCSV)