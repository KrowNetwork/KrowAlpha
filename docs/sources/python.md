## Instantiate Krow
**CURRENTLY, PYTHON CODE CAN ONLY BE WRITTEN AND RAN IN THE PYTHON FOLDER**<br />
To instantiate a Krow object, use the following command:<br />
~~~~
import Krow

krow = Krow("https://18.220.46.51:3000/")
~~~~

# Run the tests
Running the tests is super easy. <br />
~~~
from Krow import *
import test_suite
import time

chain = Chain("http://18.220.46.51:3000/")
# test_suite.delete_samples(chain) # if you need to delete the samples
# test_suite.create_samples(chain) # only use if you just deleted the samples
x = test_suite.test_all(chain) # Runs all tests
for i in x:
    print (i)
# print (test_suite.test_1(chain, "results/test_1/", write=False)) # run individual tests. Leave write=False
# print (test_suite.test_2(chain, "results/test_2/", write=True))
# print (test_suite.test_3(chain, "results/test_3/", write=True))
# print (test_suite.test_4(chain, "results/test_4/", write=True))
# print (test_suite.test_5(chain, "results/test_5/", write=True))
# print (test_suite.test_6(chain, "results/test_6/", write=True))
# print (test_suite.test_7(chain, "results/test_7/", write=True))
# print (test_suite.test_8(chain, "results/test_8/", write=False))
# print (test_suite.test_9(chain, "results/test_9/", write=False))
# print (test_suite.test_10(chain, "results/test_10/", write=False))
# print (test_suite.test_11(chain, "results/test_11/", write=False))
# print (test_suite.test_12(chain, "results/test_12/", write=False))
# print (test_suite.test_13(chain, "results/test_13/", write=False))

time.sleep(5) # optional

for i in test_suite.get_transaction_history(chain)[-10:]: # optional. Prints last 10 entries from the chain
    print (i)

~~~
