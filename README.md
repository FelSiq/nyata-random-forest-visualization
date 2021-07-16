## Nyata: visualization and analysis of Decision Tree and Random Forest models
- Web platform to visualize and interpret Random Forests and Decision Tree models.
- Compatible with scikit-learn tree and forest models.
- Can be used with both Classification and Regression models.

## Instalation
First things first, you need to have **Python 3**, **pip**, [**node.js** and **npm**](https://github.com/nvm-sh/nvm), and [**angular 2**](https://angular.io/cli) installed in your local machine in order to proceed with the Nyata installation.

After everything listed above checks out, now you need to install both the dependencies from the fron-end and back-end. The script `install.sh` should do the work for you, with a bit of luck, if you run it giving your package manager as argument:

```bash
./install.sh <your package manager>
```
I wrote down the `Makefile`s for the following package managers: `yay`, `pacman`, `apt`, `apt-get`. If your package manager is not in this list, just look into the `Makefile` in the backend and install the dependencies by yourself manually.
```bash
./install.sh pacman
```
```bash
./install.sh yay
```
```bash
./install.sh apt
```
```bash
./install.sh apt-get
```

## Depencies
Nyata depends on the following third-party softwares:
- Python 3
- Packages for Python 3 (check backend/requirements.txt for the complete list)
- Redis
- npm
- Angular 2 (ng)
- Tons of javascript/typescript/angular dependencies

## Security warnings
If you're going to use the current version of Nyata in your system, remember that:
- Do not use the public available secret key given in the backend/Makefile, since it is just for debugging purposes
- Nyata gets an `.pickle` file as input for the front-end, and `.pickle` files are not secure. Hence, you'll probably keep Nyata as a personal tool, and not expose your system to the public.

## Main features
- The platform works with sklearn Random Forest Classifiers and Regressors, and Decision Tree Classifiers and Regressors;
- Model parameter summary and statistics;
![Main view of the platform.](images/main.png)
- Interactive view of every tree in the forest;
![View of an annotated tree of the forest model.](images/tree-annotations.png)
![Options available to show alongside the interactive view of the trees.](images/menu-opt.png)
- Prediction of a custom instance or an entire dataset of test instances;
![Highlighted prediction path of a custom test instance.](images/pred-path.png)
- Analysis of the most common rules of the forest; and
![Analysis of the forest most common rules.](images/most-common-rules-1.png)
![Analysis of the forest most common rules, with feature names.](images/most-common-rules-2.png)
- Tree hierarchical clustering based on prediction values or tree meta-characteristics.
![View of a hierarchical cluster performed on the forest trees.](images/tree-clustering.png)

## Development
This platform is currently under development. The majority of the main features are finished. It just requires more testing, some polishment, and minor corrections.
