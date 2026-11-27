# Encoding a signed integer

Why does −65 need one more payload byte than −64? Inspect the high bit and the seven data bits in each byte.

![[tsfile-zigzag.html#bytes?n=-64&lang=en]]

Choose **-65**. ZigZag maps it to 129 and the payload becomes `81 01`. The one-value block starts with `02 01` for payload length and value count.

[[tsfile-zigzag.html#bytes?n=-65&lang=en|Open the two-byte example in a tab]] · [IntZigzagEncoder block format ↗](https://github.com/apache/tsfile/blob/911a7e684e56fb2822c80009bce823e7ece0bd19/java/tsfile/src/main/java/org/apache/tsfile/encoding/encoder/IntZigzagEncoder.java#L51-L87) · [Raw Java ↗](https://raw.githubusercontent.com/apache/tsfile/911a7e684e56fb2822c80009bce823e7ece0bd19/java/tsfile/src/main/java/org/apache/tsfile/encoding/encoder/IntZigzagEncoder.java#:~:text=private%20byte%5B%5D%20encodeInt)

Also explore · [[Skipping pages by time]] · [[Finding a child node]]

*Illustrative data following the Java implementation in Apache TsFile 2.5.0.*
