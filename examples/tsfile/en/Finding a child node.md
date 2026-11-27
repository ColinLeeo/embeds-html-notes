# Finding a child node

An index node has entries for s02, s05, s09 and s12. Search for the missing key s07 to see which byte interval the reader follows.

![[tsfile-index-lookup.html#lookup?key=s07&mode=floor&lang=en]]

Compare **Predecessor** with **Exact match**. Only the first returns the s05 child, covering bytes 256 through 447. Try s01 to see the lower-bound case.

[[tsfile-index-lookup.html#lookup?key=s07&mode=exact&lang=en|Open the exact-match case in a tab]] · [MetadataIndexNode child lookup ↗](https://github.com/apache/tsfile/blob/911a7e684e56fb2822c80009bce823e7ece0bd19/java/tsfile/src/main/java/org/apache/tsfile/file/metadata/MetadataIndexNode.java#L128-L165) · [Raw Java ↗](https://raw.githubusercontent.com/apache/tsfile/911a7e684e56fb2822c80009bce823e7ece0bd19/java/tsfile/src/main/java/org/apache/tsfile/file/metadata/MetadataIndexNode.java#:~:text=getChildIndexEntry)

Also explore · [[Encoding a signed integer]] · [[Skipping pages by time]]

*Illustrative data following the Java implementation in Apache TsFile 2.5.0.*
