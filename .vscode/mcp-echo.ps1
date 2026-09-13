#requires -Version 5.1
# Minimal MCP stdio server exposing "echo", "reverse", "uppercase", "get_time", and "calculate" tools.
$ErrorActionPreference = 'Stop'

$outStream = [Console]::OpenStandardOutput()
$writer = New-Object System.IO.StreamWriter($outStream)
$writer.AutoFlush = $true
$writer.NewLine = "`n"

function Send-Response {
    param($Object)
    $json = $Object | ConvertTo-Json -Depth 10 -Compress
    $writer.WriteLine($json)
}

$tools = @(
    @{
        name        = "echo"
        description = "Echoes back the provided text."
        inputSchema = @{
            type       = "object"
            properties = @{
                text = @{ type = "string"; description = "Text to echo back." }
            }
            required   = @("text")
        }
    },
    @{
        name        = "reverse"
        description = "Reverses the provided text."
        inputSchema = @{
            type       = "object"
            properties = @{
                text = @{ type = "string"; description = "Text to reverse." }
            }
            required   = @("text")
        }
    },
    @{
        name        = "uppercase"
        description = "Converts the provided text to uppercase."
        inputSchema = @{
            type       = "object"
            properties = @{
                text = @{ type = "string"; description = "Text to uppercase." }
            }
            required   = @("text")
        }
    },
    @{
        name        = "get_time"
        description = "Returns the current local date and time."
        inputSchema = @{
            type       = "object"
            properties = @{}
        }
    },
    @{
        name        = "calculate"
        description = "Performs a basic arithmetic operation (+, -, *, /) on two numbers."
        inputSchema = @{
            type       = "object"
            properties = @{
                a         = @{ type = "number"; description = "First operand." }
                b         = @{ type = "number"; description = "Second operand." }
                operator  = @{ type = "string"; description = "One of +, -, *, /." }
            }
            required   = @("a", "b", "operator")
        }
    }
)

while ($true) {
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { break }
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    try {
        $request = $line | ConvertFrom-Json -ErrorAction Stop
    } catch {
        continue
    }

    $method = $request.method
    $id = $request.id

    switch ($method) {
        "initialize" {
            Send-Response @{
                jsonrpc = "2.0"
                id      = $id
                result  = @{
                    protocolVersion = "2024-11-05"
                    capabilities    = @{ tools = @{} }
                    serverInfo      = @{ name = "echo-windows"; version = "1.0.0" }
                }
            }
        }
        "notifications/initialized" {
            # notification: no response expected
        }
        "tools/list" {
            Send-Response @{
                jsonrpc = "2.0"
                id      = $id
                result  = @{ tools = $tools }
            }
        }
        "tools/call" {
            $toolName = $request.params.name
            $toolArgs = $request.params.arguments
            $text = [string]$toolArgs.text
            switch ($toolName) {
                "echo" {
                    Send-Response @{
                        jsonrpc = "2.0"
                        id      = $id
                        result  = @{
                            content = @(@{ type = "text"; text = $text })
                            isError = $false
                        }
                    }
                }
                "reverse" {
                    $reversed = -join ($text[-1..-$text.Length])
                    Send-Response @{
                        jsonrpc = "2.0"
                        id      = $id
                        result  = @{
                            content = @(@{ type = "text"; text = $reversed })
                            isError = $false
                        }
                    }
                }
                "uppercase" {
                    Send-Response @{
                        jsonrpc = "2.0"
                        id      = $id
                        result  = @{
                            content = @(@{ type = "text"; text = $text.ToUpperInvariant() })
                            isError = $false
                        }
                    }
                }
                "get_time" {
                    Send-Response @{
                        jsonrpc = "2.0"
                        id      = $id
                        result  = @{
                            content = @(@{ type = "text"; text = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") })
                            isError = $false
                        }
                    }
                }
                "calculate" {
                    $a = [double]$toolArgs.a
                    $b = [double]$toolArgs.b
                    $op = [string]$toolArgs.operator
                    $errorMsg = $null
                    $calcResult = $null
                    switch ($op) {
                        "+" { $calcResult = $a + $b }
                        "-" { $calcResult = $a - $b }
                        "*" { $calcResult = $a * $b }
                        "/" {
                            if ($b -eq 0) { $errorMsg = "Division by zero." }
                            else { $calcResult = $a / $b }
                        }
                        default { $errorMsg = "Unsupported operator: $op" }
                    }
                    if ($errorMsg) {
                        Send-Response @{
                            jsonrpc = "2.0"
                            id      = $id
                            result  = @{
                                content = @(@{ type = "text"; text = $errorMsg })
                                isError = $true
                            }
                        }
                    } else {
                        Send-Response @{
                            jsonrpc = "2.0"
                            id      = $id
                            result  = @{
                                content = @(@{ type = "text"; text = [string]$calcResult })
                                isError = $false
                            }
                        }
                    }
                }
                default {
                    Send-Response @{
                        jsonrpc = "2.0"
                        id      = $id
                        error   = @{ code = -32601; message = "Unknown tool: $toolName" }
                    }
                }
            }
        }
        "ping" {
            Send-Response @{ jsonrpc = "2.0"; id = $id; result = @{} }
        }
        default {
            if ($id) {
                Send-Response @{
                    jsonrpc = "2.0"
                    id      = $id
                    error   = @{ code = -32601; message = "Method not found: $method" }
                }
            }
        }
    }
}
