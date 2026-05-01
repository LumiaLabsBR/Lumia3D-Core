using FluentAssertions;
using Lumia3DCore.Services;

namespace Lumia3DCore.Tests.Services;

public class VersionInfoTests
{
    [Fact]
    public void Current_IsNotNullOrEmpty()
        => VersionInfo.Current.Should().NotBeNullOrEmpty();

    [Fact]
    public void Short_ContainsOnlyVersionNumbers()
    {
        // Should match N.N.N (no pre-release suffix or build metadata)
        VersionInfo.Short.Should().MatchRegex(@"^\d+\.\d+\.\d+$");
    }

    [Fact]
    public void Short_IsPrefixOfCurrent()
        => VersionInfo.Current.Should().StartWith(VersionInfo.Short);

    [Fact]
    public void Commit_IsNotNullOrEmpty()
        => VersionInfo.Commit.Should().NotBeNullOrEmpty();

    [Fact]
    public void BuildDate_MatchesDateFormat()
        => VersionInfo.BuildDate.Should().MatchRegex(@"^\d{4}-\d{2}-\d{2}$");
}
