from numpy.core.fromnumeric import size
import pandas as pd
import numpy as np

crimeCSVPath = r"C:\Users\victo\Desktop\6.859\final-project-discover_boston_crime\crime.csv"
aggregatedGroupPath = r"C:\Users\victo\Desktop\6.859\final-project-discover_boston_crime\crime_aggregated_code_groups.csv"

def showDistribution(df):
    offenseDescriptionFrequencyDict = {}
    UCRParttoOffenseMap = {"Part One": set(), "Part Two": set(), "Part Three": set(), "None": set()}
    UCRFrequencyDict = {"Part One": 0, "Part Two": 0, "Part Three": 0, "None": 0}
    offenseCodeGrouptoDescriptionMap = {}

    
    #for i in range(df.shape[0]):
    for i in range(4156):
        UCRPart = df.iloc[i,df.columns.get_loc("UCR_PART")]
        offenseDescription = df.iloc[i,df.columns.get_loc("Aggregated Offence Code Group")]
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



def aggregateCodeGroups():
    orignalDF = pd.read_csv(crimeCSVPath, engine='python')

    aggregationDict = {
        "Larceny" : {"Larceny", "Larceny From Motor Vehicle"},
        "Robbery" : {"Robbery"},
        "Burglary" : {"Residential Burglary", "Other Burglary", "Commercial Burglary", "Burglary - No Property Taken"},
        "Human Trafficking and Prostitution" : {"HUMAN TRAFFICKING", "HUMAN TRAFFICKING - INVOLUNTARY SERVITUDE", "Prostitution"},
        "Homicide and Manslaughter" : {"Homicide", "Manslaughter"},
        "Firearms and Explosives" : {"Firearm Violations", "Firearm Discovery", "Explosives", "Ballistics"},
        "Assault" : {"Simple Assault", "Aggravated Assault"},
        "Drug Violation" : {"Drug Violation"},
        "Vandalism" : {"Vandalism"},
        "Arson" : {"Arson"},
        "Domestic Abuse" : {"Offenses Against Child / Family"},
        "Disorderly Conduct" : {"Disorderly Conduct", "Verbal Disputes"},
        "Restraining Order Violations" : {"Restraining Order Violations"},
        "Other" : {"Other"}
    }

    codeLookUpDict = {}

    for key in aggregationDict.keys():
        for code in aggregationDict[key]:
            codeLookUpDict[code] = key
    

    aggregatedCodeGroupCol = []

    for i in range(orignalDF.shape[0]):
        offenseGroupCode = orignalDF.iloc[i,orignalDF.columns.get_loc("OFFENSE_CODE_GROUP")]

        if(offenseGroupCode in codeLookUpDict.keys()):
            aggregatedCodeGroupCol.append(codeLookUpDict[offenseGroupCode])
        else:
            aggregatedCodeGroupCol.append("")

    orignalDF.insert(orignalDF.shape[1], "Aggregated Offence Code Group", aggregatedCodeGroupCol)

    orignalDF.drop(orignalDF[orignalDF["Aggregated Offence Code Group"].map(len) == 0].index, inplace=True)
    
    orignalDF.to_csv(aggregatedGroupPath)






if __name__ == "__main__":
    crimeCSV = pd.read_csv(aggregatedGroupPath, engine='python')
    showDistribution(crimeCSV)
    #aggregateCodeGroups()
