def get_toy_model(forest: bool = True, regressor: bool = False):
    """Create a DT/RF toy model for testing purposes."""
    import numpy as np # linear algebra
    import sklearn.tree
    import sklearn.ensemble
    from sklearn.datasets import load_iris

    iris = load_iris()  # type: sklearn.utils.Bunch

    X = iris.data
    y = iris.target
    attr_labels = iris.feature_names

    algorithms = {
        (False, False): sklearn.tree.DecisionTreeClassifier,
        (False, True): sklearn.tree.DecisionTreeRegressor,
        (True, False): sklearn.ensemble.RandomForestClassifier,
        (True, True): sklearn.ensemble.RandomForestRegressor,
    }

    if forest:
        args = {
            "n_estimators": 10,
            "min_samples_split": 2,
            "min_samples_leaf": 1,
        }
    else:
        args = {}

    model = algorithms.get((forest, regressor),
                           sklearn.tree.DecisionTreeClassifier)(**args)
    model.fit(iris.data, iris.target)

    return model, X, y, attr_labels


def get_custom_model():
    import pandas as pd
    import numpy as np
    from sklearn.ensemble import RandomForestClassifier
    
    X_data = np.loadtxt(
        './custom_model/dados_hospital_cancer/X_train.txt')
    y_data = pd.Series(
        np.loadtxt('./custom_model/dados_hospital_cancer/y_train.txt'), name = 'pseudost', dtype = int)
    
    att_labels = np.loadtxt('./custom_model/dados_hospital_cancer/Attributes.txt', dtype='str')
    att_freq5 = np.loadtxt('./custom_model/dados_hospital_cancer/att_freq5', dtype='int')
    att_freq6 = np.loadtxt('./custom_model/dados_hospital_cancer/att_freq6', dtype='int')
    
    estimators=50; criterion='entropy'; max_features='auto'
    
    """
    # Fequency = 5
    # print(att_labels[att_freq5==1])
    X_fitness5 = np.delete(X_data, np.where(att_freq5 == 0)[0], axis=1)
    model_freq5 = RandomForestClassifier(n_estimators=estimators, max_features=max_features, 
                                         criterion=criterion, random_state=0)
    model_freq5.fit(X_fitness5, y_data)

    return model_freq5, X_fitness5, y_data, att_labels[att_freq5==1]
    """
    
    # Fequency = 6
    # print(att_labels[att_freq6==1])
    X_fitness6 = np.delete(X_data, np.where(att_freq6 == 0)[0], axis=1)
    model_freq6 = RandomForestClassifier(n_estimators=estimators, max_features=max_features, 
                                         criterion=criterion, random_state=0)
    model_freq6.fit(X_fitness6, y_data)

    return model_freq6, X_fitness6, y_data, att_labels[att_freq6==1]
