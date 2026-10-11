using System;
using System.Diagnostics;
using System.IO;
using System.Text;

public class ExcelReport {
    public static int Main() {
        Console.OutputEncoding = Encoding.UTF8;
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string script = Path.Combine(root, "integrations", "auth-report", "launch.cjs");
        int result = 1;
        try {
            if (!File.Exists(script)) throw new FileNotFoundException("실습 폴더 안에서 ExcelReport.exe를 실행해 주세요.");
            Console.WriteLine("Excel 검사와 Claude 분석을 시작합니다. 이 창을 닫지 마세요.");
            ProcessStartInfo start = new ProcessStartInfo();
            start.FileName = "node.exe";
            start.Arguments = "\"" + script + "\"";
            start.WorkingDirectory = root;
            start.UseShellExecute = false;
            using (Process child = Process.Start(start)) {
                child.WaitForExit();
                result = child.ExitCode;
            }
        } catch (Exception) {
            Console.WriteLine("실행하지 못했습니다. Node.js 설치, 실습 폴더, 터미널의 준비 명령을 확인해 주세요.");
        }
        Console.WriteLine("결과 코드: " + result + " · Enter를 누르면 닫습니다.");
        Console.ReadLine();
        return result;
    }
}
