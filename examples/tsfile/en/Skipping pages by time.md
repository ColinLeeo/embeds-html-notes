# Skipping pages by time

Five pages cover different timestamp intervals. Which pages could still contain a point between 32 and 54?

![[tsfile-page-filter.html#window?range=middle&lang=en]]

Select **Touch endpoints**. P2 ends at 58 and P3 starts at 62. Both touch the inclusive window. Now choose **Between pages** and the candidate count drops to zero.

[[tsfile-page-filter.html#window?range=touch&lang=en|Open the endpoint case in a tab]] · [TimeBetweenAnd interval test ↗](https://github.com/apache/tsfile/blob/911a7e684e56fb2822c80009bce823e7ece0bd19/java/tsfile/src/main/java/org/apache/tsfile/read/filter/operator/TimeFilterOperators.java#L405-L428) · [Raw Java ↗](https://raw.githubusercontent.com/apache/tsfile/911a7e684e56fb2822c80009bce823e7ece0bd19/java/tsfile/src/main/java/org/apache/tsfile/read/filter/operator/TimeFilterOperators.java#:~:text=startTime%20%3C%3D%20max)

Also explore · [[Finding a child node]] · [[Encoding a signed integer]]

*Illustrative data following the Java implementation in Apache TsFile 2.5.0.*
