from Krow import *
import test_suite

chain = Chain("http://18.216.142.10:3000/")

x = test_suite.test_1(chain, "./")
print (x)