import typing as t
import os

import numpy as np


REPORT_PATH = "./reports/"

if not os.path.isdir(REPORT_PATH):
    print("Not found '{}' directory for reports.".format(REPORT_PATH))

    try:
        os.mkdir(REPORT_PATH)

    except OSError:
        print("Failed to create report repository in '{}'".format(REPORT_PATH))
        REPORT_PATH = "./"


def report_most_common_seq(
    top_common_seqs: t.Sequence[t.Tuple[float, float]], include_node_decision: bool
) -> None:
    """TODO."""
    num_seqs = len(top_common_seqs[0])

    filename = "_".join(
        [
            "most_common",
            "rules" if include_node_decision else "attr_seq",
            "{}.csv".format(num_seqs),
        ]
    )

    filepath = os.path.join(REPORT_PATH, filename)

    with open(filepath, "w") as f:
        f.write("rank,freq,attr_seq\n")
        for i, (seq, freq) in enumerate(zip(*top_common_seqs), 1):
            f.write("{},{:.8f},'{}'\n".format(i, freq, seq))


def report_hier_clus(
    hier_clus_data: t.Dict[str, np.ndarray], threshold_cut: float
) -> None:
    """TODO."""
    num_clust = len(hier_clus_data["clust_assignment"])
    filepath = os.path.join(REPORT_PATH, "hier_clus_{}.csv".format(num_clust))

    with open(filepath, "w") as f:
        f.write("# Threshold used as cut: {:.8f}\n".format(threshold_cut))
        f.write("cluster_id,medoid_id,cluster_tree_ids\n")

        for i, cluster in enumerate(hier_clus_data["clust_assignment"]):
            f.write(
                "{},{},'{}'\n".format(i, cluster["medoid_ind"], cluster["tree_inds"])
            )
