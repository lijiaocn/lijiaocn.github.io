---
layout: default
title: "Go wasm 使用：Go 代码编译成 WebAssembly 及调用"
author: 李佶澳
date: "2023-03-28 15:41:33 +0800"
last_modified_at: "2023-03-28 19:07:28 +0800"
categories: 编程
cover:
tags: golang 
keywords:
description: "编译得到的 wasm 文件需要通过 JavaScript engine 执行，比如浏览器内置的 js 引擎。将 go 代码中的函数暴露到浏览器中运行，需要按照规则编写 go 文件和 html 文件。"
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

Go 支持将 go 代码编译成 WebAssembly （在浏览器中执行的二进制代码），如下：

```sh
GOARCH=wasm GOOS=js go build ...
```

编译得到的 wasm 文件需要通过 JavaScript engine 执行，比如浏览器内置的 js 引擎。将 go 代码中的函数暴露到浏览器中运行，需要按照规则编写 go 文件和 html 文件。
下面两篇英文文章介绍的非常详细：

* [WebAssembly: Introduction to WebAssembly using Go][2]
* [WebAssembly: DOM Access and Error Handling][3]

## Go 代码文件

Go 代码文件主要约束如下：

* 必须位于 package main 中
* 暴露到 js 中的函数类型必须是 js.Func
* js.Func 用 systcall/js 生成，可以在其中使用标准的 go 函数，例如下面的 fotmatJSON
* js.Func 类型函数需要注册到 js.Global()中，注册时指定在 js 中的函数名
* main 函数必须常驻，不能退出
* js.Func 函数的返回值会被编译器自动转换成 js 对象。当前(go 1.18/1.19) 都不支持 error 类型到 js 对象的转换。因此如果要返回 error，可以用 map 的方式，下面的 updateJSONWithErorMap() 
* go 代码中如果要操作 dom，用 js.Global().Get("document") 获取 Call() 调用 js 函数，例如 output2 := doc.Call("getElementById", "output2")

```go
package main

import (
    "encoding/json"
    "errors"
    "fmt"
    "syscall/js"
)

func main() {
    c := make(chan bool)
    fmt.Println("Go Web Assembly")
    js.Global().Set("formatJSON", formatJSON())                        //添加 js 方法
    js.Global().Set("updateJSON", updateJSON())                        //添加 js 方法
    js.Global().Set("updateJSONWithErrorMap", updateJSONWithErorMap()) //添加 js 方法
    <-c
}

// 将 go 函数暴露到 js
func formatJSON() js.Func {
    jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
        if len(args) != 1 {
            return "Invalid no of arguments passed"
        }
        inputJson := args[0].String()
        fmt.Printf("input: %s\n", inputJson)
        pretty, err := prettyJson(inputJson)
        if err != nil {
            fmt.Printf("unable to convert to json: err=%s\n", err)
            return err.Error()
        }
        return pretty
    })
    return jsonFunc
}

func updateJSON() js.Func {
    jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
        if len(args) != 1 {
            return errors.New("Invalid no of arguments passed")
        }
        doc := js.Global().Get("document")
        if !doc.Truthy() {
            return errors.New("Unable to get document object")
        }

        output2 := doc.Call("getElementById", "output2")
        if !output2.Truthy() {
            return errors.New("Unable to get output2 text area")
        }

        inputJson := args[0].String()
        fmt.Printf("input: %s\n", inputJson)
        pretty, err := prettyJson(inputJson)
        if err != nil {
            return fmt.Errorf("unable to convert to json: err=%s\n", err)
        }
        output2.Set("value", pretty)
        return nil
    })
    return jsonFunc
}

func updateJSONWithErorMap() js.Func {

    jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
        var errStr string
        if len(args) != 1 {
            errStr = "Invalid no of arguments passed"
            fmt.Printf(errStr)
            return map[string]interface{}{"error": errStr}
        }
        doc := js.Global().Get("document")
        if !doc.Truthy() {
            errStr = "Unable to get document object"
            fmt.Printf(errStr)
            return map[string]interface{}{"error": errStr}
        }

        output2 := doc.Call("getElementById", "output2")
        if !output2.Truthy() {
            errStr = "Unable to get output2 text area"
            fmt.Printf(errStr)
            return map[string]interface{}{"error": errStr}
        }

        inputJson := args[0].String()
        fmt.Printf("input: %s\n", inputJson)
        pretty, err := prettyJson(inputJson)
        if err != nil {
            errStr = fmt.Sprintf("unable to convert to json: err=%s\n", err)
            fmt.Printf(errStr)
            return map[string]interface{}{"error": errStr}
        }
        output2.Set("value", pretty)
        return nil
    })
    return jsonFunc
}

func prettyJson(input string) (string, error) {
    var raw interface{}
    if err := json.Unmarshal([]byte(input), &raw); err != nil {
        return "", err
    }
    pretty, err := json.MarshalIndent(raw, "", "  ")
    if err != nil {
        return "", err
    }
    return string(pretty), nil
}
```

## HTML 文件

HTML 文件约束如下：

* 必须先包含 wasm_exec.js，从 GOROOT 中获取 wasm_exec.js：$(go env GOROOT)/misc/wasm/wasm_exec.js
* 用 js 函数加载 go 代码编译出来的 wasm 文件，例如下面的 main.wasm
* go 注册到 js.Global() 的函数可以直接使用


```html
<html>
    <head>
        <meta charset="utf-8">
        <script src="wasm_exec.js"></script>
        <script>
            const go = new Go();
            WebAssembly.instantiateStreaming(fetch("main.wasm"),go.importObject).then((result)=>{
                go.run(result.instance);
            });
        </script>
    </head>

<body>
    <textarea id="input" rows="10" cols="80">{"website":"golangbot.com", "tutorials": {"string":"https://golangbot.com/strings/"}}</textarea>
    <button type="button" onclick="format(input.value)">format by js</button>
    <button type="button" onclick="updateJSON(input.value)">format by go(if err panic)</button>
    <button type="button" onclick="format2(input.value)">format by go(return err map)</button>
    <br>
    <textarea id="output" rows="10" cols="80" placeholder="set by js"></textarea>
    <textarea id="output2" rows="10" cols="80" placeholder="set by go"></textarea>
<script>
    function format(input){
        output.value = formatJSON(input)
    }
    function format2(input){
        let resp = updateJSONWithErrorMap(input)
        if ((resp != null)&& ('error' in resp)){
            console.log("Go return value: ", resp)
            alert(resp.error)
        }
    }
</script>
</body>
</html>
```


## 运行

将 index.html、从 GOROOT 中复制的 wasm_exec.js 和编译得到的 main.wasm 文件，放到同一个目录。然后启动一个 webserver 即可：

```text
├── favicon.ico
├── index.html
├── main.wasm
└── wasm_exec.js
```

```sh
python3 -m http.server 8081
```


## 参考

1. [李佶澳的博客][1]
2. [WebAssembly: Introduction to WebAssembly using Go][2]
3. [WebAssembly: DOM Access and Error Handling][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://golangbot.com/webassembly-using-go/ "WebAssembly: Introduction to WebAssembly using Go"
[3]: https://golangbot.com/go-webassembly-dom-access/  "WebAssembly: DOM Access and Error Handling" 
