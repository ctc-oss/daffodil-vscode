/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import com.google.gson.JsonObject
import java.nio.file.Paths
import munit.FunSuite
import org.apache.daffodil.debugger.dap.Parse

class ParseSuite extends FunSuite {
  val name = "Default Config"
  val request = "launch"
  val launchType = "dfdl"
  val schema = new JsonObject()
  var schemaPath = Paths.get("./src/test/data/emptySchema.dfdl.xsd").toAbsolutePath().toString()
  var data = Paths.get("./src/test/data/emptyData.xml").toAbsolutePath().toString()
  val debugServer = 4711
  val infosetFormat = "xml"
  var infosetOutputType = "none"
  var infosetOutputPath = "testPath/infoset.xml"
  var tdmlAction = ""
  val tdmlName = "Test TDML Name"
  val tdmlDescription = "Test TDML Description"
  val tdmlPath = "testPath/test.tdml"
  val stopOnEntry = true
  val useExistingServer = false
  val trace = true
  val openDataEditor = false
  val openInfosetView = false
  val openInfosetDiffView = false
  val daffodilDebugClasspath = ""

  var testJsonObject = new JsonObject()
  var testTDMLObject = new JsonObject()

  override def beforeEach(context: BeforeEach): Unit = {
    schemaPath = Paths.get("./src/test/data/emptySchema.dfdl.xsd").toAbsolutePath().toString()
    data = Paths.get("./src/test/data/emptyData.xml").toAbsolutePath().toString()
    infosetOutputType = "none"
    infosetOutputPath = "testPath/infoset.xml"
    tdmlAction = ""

    testJsonObject = new JsonObject()
    testTDMLObject = new JsonObject()
  }

  test("Parse Successful") {
    buildJson()
    assertEquals(Parse.Debugee.LaunchArgs.parse(testJsonObject).isRight, true)
  }

  test("Parse failed - No Schema") {
    buildJson()
    schema.remove("path")
    val parseResult = Parse.Debugee.LaunchArgs.parse(testJsonObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(parseResult.swap.toOption.map(_.head).getOrElse("no error"), "missing 'schema.path' field from launch request")
  }

  test("Parse failed - No data") {
    buildJson()
    testJsonObject.remove("data")
    val parseResult = Parse.Debugee.LaunchArgs.parse(testJsonObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(parseResult.swap.toOption.map(_.head).getOrElse("no error"), "missing 'data' field from launch request")
  }

  // This test succeeds because stopOnEntry defaults if it is empty
  test("Parse Succeeds with No stopOnEntry") {
    buildJson()
    testJsonObject.remove("stopOnEntry")
    val parseResult = Parse.Debugee.LaunchArgs.parse(testJsonObject)
    assertEquals(parseResult.isRight, true)
  }

  test("Parse succeeds without infosetFormat") {
    buildJson()
    testJsonObject.remove("infosetFormat")
    val parseResult = Parse.Debugee.LaunchArgs.parse(testJsonObject)
    assertEquals(parseResult.isRight, true)
  }

  test("Parse failed - invalid infosetOutput") {
    infosetOutputType = "file"
    infosetOutputPath = Seq("not", "a", "path", "kashfil-`dkad").mkString(java.io.File.separator)
    buildJson()
    val parseResult = Parse.Debugee.LaunchArgs.parse(testJsonObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(parseResult.swap.toOption.map(_.head).getOrElse("no error"), "can't write to infoset output file at " + infosetOutputPath)
    infosetOutputType = "none"
    infosetOutputPath = "testPath/infoset.xml"
  }

  test("Parse failed - invalid tdmlConfig - no name") {
    tdmlAction = "generate"
    buildJson()
    testTDMLObject.remove("name")
    val parseResult = Parse.Debugee.parseTDMLName(testTDMLObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(parseResult.swap.toOption.map(_.head).getOrElse("no error"), "missing 'tdmlConfig.name' field from launch request")
  }

  test("Parse failed - invalid tdmlConfig - no description") {
    tdmlAction = "generate"
    buildJson()
    testTDMLObject.remove("description")
    val parseResult = Parse.Debugee.parseTDMLDescription(testTDMLObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(parseResult.swap.toOption.map(_.head).getOrElse("no error"), "missing 'tdmlConfig.description' field from launch request")
  }

  test("Parse failed - invalid tdmlConfig - no path") {
    tdmlAction = "generate"
    buildJson()
    testTDMLObject.remove("path")
    val parseResult = Parse.Debugee.parseTDMLPath(testTDMLObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(parseResult.swap.toOption.map(_.head).getOrElse("no error"), "missing 'tdmlConfig.path' field from launch request")
  }

  test("Parse failed - invalid tdmlConfig - invalid action") {
    tdmlAction = "InvalidAction"
    buildJson()
    val parseResult = Parse.Debugee.parseTDML(testJsonObject, testTDMLObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(
      parseResult.swap.toOption.map(_.head).getOrElse("no error"),
      "invalid 'tdmlConfig.action': 'InvalidAction', must be 'generate', 'append', 'none', or 'execute'"
    )
  }

  test("Parse failed - Invalid Schema Path") {
    schemaPath = "badPath.dfdl.xsd"
    buildJson()
    val parseResult = Parse.Debugee.LaunchArgs.parse(testJsonObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(parseResult.swap.toOption.map(_.head).getOrElse("no error"), s"schema file at $schemaPath doesn't exist")
  }

  test("Parse failed - infosetOutputType not file") {
    tdmlAction = "generate"
    buildJson()
    val parseResult = Parse.Debugee.LaunchArgs.parse(testJsonObject)
    assertEquals(parseResult.isLeft, true)
    assertEquals(parseResult.swap.toOption.map(_.head).getOrElse("no error"), "'type' field in 'infosetOutput' must be set to 'file'")
  }

  def buildJson(): Unit = {
    schema.addProperty("path", schemaPath)

    val infoset = new JsonObject()
    infoset.addProperty("type", infosetOutputType)
    infoset.addProperty("path", infosetOutputPath)

    testTDMLObject.addProperty("action", tdmlAction)
    testTDMLObject.addProperty("name", tdmlName)
    testTDMLObject.addProperty("description", tdmlDescription)
    testTDMLObject.addProperty("path", tdmlPath)

    testJsonObject.addProperty("name", name)
    testJsonObject.addProperty("request", request)
    testJsonObject.addProperty("type", launchType)
    testJsonObject.add("schema", schema)
    testJsonObject.addProperty("data", data)
    testJsonObject.addProperty("debugServer", debugServer)
    testJsonObject.addProperty("infosetFormat", infosetFormat)

    testJsonObject.add("infosetOutput", infoset)

    if (!tdmlAction.isEmpty()) {
      testJsonObject.add("tdmlConfig", testTDMLObject)
    }

    testJsonObject.addProperty("stopOnEntry", stopOnEntry)
    testJsonObject.addProperty("useExistingServer", useExistingServer)
    testJsonObject.addProperty("trace", trace)
    testJsonObject.addProperty("openDataEditor", openDataEditor)
    testJsonObject.addProperty("openInfosetView", openInfosetView)
    testJsonObject.addProperty("openInfosetDiffView", openInfosetDiffView)
    testJsonObject.addProperty("daffodilDebugClasspath", daffodilDebugClasspath)
  }

}
