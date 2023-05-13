/*
Copyright 2010 Intel Corporation

Use, modification and distribution are subject to the Boost Software License,
Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
http://www.boost.org/LICENSE_1_0.txt).
*/

// code modified for the Deepnest project by Jack Qiao
// https://github.com/Jack000/Deepnest/blob/master/minkowski.h

#include <nan.h>
#include <iostream>
#define BOOST_POLYGON_NO_DEPS
#include <boost/polygon/polygon.hpp>

NAN_METHOD(calculateNFP);
